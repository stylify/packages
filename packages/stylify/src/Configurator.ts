import { existsSync, FSWatcher, watch } from 'fs';
import { join } from 'path';
import type { CompilerConfigInterface } from './Compiler';
import { mergeObjects } from '.';

export type ConfiguratorConfigsType = Record<string, any>;

export type ObjectToMergeType = Record<string, any>;

export type OnConfigChangedCallbackType = <T extends DefaultConfigInterface>(config: T) => void;

interface ConfigsQueueInterface {
	position: number,
	promisePosition: number | null
	config: ConfiguratorConfigsType | null
}

export interface ConfiguratorConfigInterface {
	onConfigChanged?: OnConfigChangedCallbackType,
	configs?: (ConfiguratorConfigsType | string)[]
}

export interface DefaultConfigInterface extends Record<string, any> {
	compiler?: CompilerConfigInterface
}

export class Configurator {

	public static defaultConfigName = 'stylify.config.js';

	private configsAreProcessedPromise: Promise<void> = null;

	private rawConfigs: (ConfiguratorConfigsType | string)[] = [];

	private configFilesToWatch: Record<string, FSWatcher> = {};

	private onConfigChanged: OnConfigChangedCallbackType = null;

	constructor(config: ConfiguratorConfigInterface = {}) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this.configure(config);
	}

	public configure(config: ConfiguratorConfigInterface = {}): void {
		this.onConfigChanged = config.onConfigChanged ?? this.onConfigChanged;
		this.addConfigs(config.configs ?? []);
	}

	public static getDefaultConfigPath(path: string): string {
		return join(path, this.defaultConfigName);
	}

	public async processConfigs<T extends DefaultConfigInterface>(
		configs: (ConfiguratorConfigsType | string)[] = []
	): Promise<T> {
		if (this.configsAreProcessedPromise !== null) {
			await this.configsAreProcessedPromise;
			return;
		}

		let configsProcessed = null;
		this.configsAreProcessedPromise = new Promise((resolve): void => {
			configsProcessed = () => {
				resolve();
				this.configsAreProcessedPromise = null;
			};
		});

		this.addConfigs(configs);

		const configsLoadingPromises: Promise<ConfiguratorConfigsType>[] = [];
		const configsToAdd: ConfigsQueueInterface[] = [];

		for (const config of this.rawConfigs) {
			const configsToAddLength = configsToAdd.length;
			const configToAdd: ConfigsQueueInterface = {
				position: configsToAddLength > 0 ? configsToAddLength - 1 : 0,
				promisePosition: null,
				config: null
			};

			if (typeof config !== 'string') {
				configToAdd.config = config;
				configsToAdd.push(configToAdd);
				continue;
			}

			const configsLoadingPromisesLength = configsLoadingPromises.length;
			configToAdd.promisePosition = configsLoadingPromisesLength > 0 ? configsLoadingPromisesLength - 1 : 0;
			configsLoadingPromises.push(this.loadConfigFile<ConfiguratorConfigsType>(config));
			if (!(config in this.configFilesToWatch) && this.onConfigFileChangedHook) {
				this.configFilesToWatch[config] = watch(config, () => {
					if (this.configsAreProcessedPromise !== null) {
						return;
					}
					// eslint-disable-next-line @typescript-eslint/no-floating-promises
					this.onConfigFileChangedHook();
				});
			}
		}

		await Promise.all(configsLoadingPromises);

		const configsToMerge: ConfiguratorConfigsType[] = configsToAdd.map((config): DefaultConfigInterface => {
			if (config.promisePosition !== null) {
				config.config = configsLoadingPromises[config.promisePosition];
			}

			return config.config;
		});

		const mergedConfig = mergeObjects(...configsToMerge);

		configsProcessed();

		return mergedConfig as T;
	}

	private async onConfigFileChangedHook(): Promise<void> {
		const config = await this.processConfigs();
		this.onConfigChanged(config);
	}

	private addConfigs(configs: (ConfiguratorConfigsType | string)[]): void {
		this.rawConfigs = [...this.rawConfigs, ...configs];
	}

	public async loadConfigFile<T extends Record<string, any> = Record<string, any>>(configPath: string): Promise<T> {
		let config = {};

		if (existsSync(configPath)) {
			config = await import(configPath);

		} else {
			console.error(`Config "${configPath}" not found. Skipping.`);
		}

		return config as T;
	}

}
