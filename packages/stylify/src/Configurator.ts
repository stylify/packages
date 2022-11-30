import { existsSync } from 'fs';
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
	configs?: (ConfiguratorConfigsType | string)[]
}

export interface DefaultConfigFiles {
	js?: string,
	mjs?: string,
	cjs?: string
}

export interface DefaultConfigInterface extends Record<string, any> {
	compiler?: CompilerConfigInterface
}

export class Configurator {

	public static defaultConfigName = 'stylify.config';

	private configsAreProcessedPromise: Promise<void> = null;

	private rawConfigs: (ConfiguratorConfigsType | string)[] = [];

	constructor(config: ConfiguratorConfigInterface = {}) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this.configure(config);
	}

	public configure(config: ConfiguratorConfigInterface = {}): void {
		this.addConfigs(config.configs ?? []);
	}

	public static getDefaultExistingConfigFiles(path: string): DefaultConfigFiles {
		const configs: DefaultConfigFiles = {};

		['js', 'mjs', 'cjs'].forEach((suffix) => {
			const filePath = join(path, `${this.defaultConfigName}.${suffix}`);
			if (existsSync(filePath)) {
				configs[suffix] = filePath;
			}
		});

		return configs;
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
			const configIsFilePathString = typeof config === 'string';
			const configsToAddLength = configsToAdd.length;
			const configToAdd: ConfigsQueueInterface = {
				position: configsToAddLength > 0 ? configsToAddLength - 1 : 0,
				promisePosition: null,
				config: configIsFilePathString ? null : config
			};

			configsToAdd.push(configToAdd);

			if (!configIsFilePathString) {
				continue;
			}

			const configsLoadingPromisesLength = configsLoadingPromises.length;
			configToAdd.promisePosition = configsLoadingPromisesLength > 0 ? configsLoadingPromisesLength - 1 : 0;
			configsLoadingPromises.push(this.loadConfigFile<ConfiguratorConfigsType>(config));
		}

		const configsFromFiles = await Promise.all(configsLoadingPromises);
		const configsToMerge: ConfiguratorConfigsType[] = configsToAdd.map((config): DefaultConfigInterface => {
			if (config.promisePosition !== null) {
				config.config = configsFromFiles[config.promisePosition];
			}

			if (typeof config.config === 'function') {
				config.config = config.config();
			}

			return config.config;
		});

		const mergedConfig = mergeObjects(...configsToMerge);

		configsProcessed();

		return mergedConfig as T;
	}

	private addConfigs(configs: (ConfiguratorConfigsType | string)[]): void {
		for (const config of configs) {
			if (typeof config === 'string' && this.rawConfigs.includes(config)) {
				continue;
			}

			this.rawConfigs.push(config);
		}
	}

	public async loadConfigFile<T extends Record<string, any> = Record<string, any>>(configPath: string): Promise<T> {
		let config = {
			default: {}
		};

		if (existsSync(configPath)) {
			config = await import(configPath);

		} else {
			console.error(`Config "${configPath}" not found. Skipping.`);
		}

		return config.default as T;
	}

}
