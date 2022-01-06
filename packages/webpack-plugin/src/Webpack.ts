import { BundleConfigInterface, BundlerConfigInterface, Bundler } from '@stylify/bundler';
import { nativePreset } from '@stylify/stylify';

export interface WebpackPluginConfigInterface {
	bundles: BundleConfigInterface[];
	dev?: boolean;
	bundler?: BundlerConfigInterface;
	beforeApply?: (plugin: StylifyWebpackPlugin) => void;
	afterApply?: (plugin: StylifyWebpackPlugin, compiler: any) => void;
	extend?: Partial<WebpackPluginConfigInterface>;
}

export class StylifyWebpackPlugin {

	private config: WebpackPluginConfigInterface = {
		dev: null,
		bundles: [],
		beforeApply: null,
		afterApply: null,
		bundler: {
			compiler: nativePreset.compiler
		}
	}

	constructor(config: WebpackPluginConfigInterface) {
		this.mergeConfig(config);

		if (this.config.dev === false
			&& (!('bundler' in config)
				|| typeof config.bundler.compiler === 'object' && !('mangleSelectors' in config.bundler.compiler)
			)
		) {
			this.config.bundler.compiler.mangleSelectors = true;
		}

		if (typeof this.config.beforeApply === 'function') {
			this.config.beforeApply(this);
		}
	}

	private mergeObject(...objects): any {
		const newObject = {};

		for (const processedObject of objects) {
			for (const processedObjectKey in processedObject) {
				const newValue = processedObject[processedObjectKey];

				if (processedObjectKey in newObject) {
					if (Array.isArray(newValue)) {
						newObject[processedObjectKey] = [
							...newObject[processedObjectKey],
							...newValue
						];
						continue;

					} else if (typeof newValue === 'object' && newValue !== null) {
						newObject[processedObjectKey] = this.mergeObject(newObject[processedObjectKey], newValue);
						continue;
					}
				}

				newObject[processedObjectKey] = newValue;
			}
		}

		return newObject;
	}

	private mergeConfig(config: Record<string, any> = {}): void {
		if ('extend' in config) {
			this.config = this.mergeObject(this.config, config.extend);
			delete config.extend;
		}

		this.config = {...this.config, ...config};
	}

	apply(compiler: Record<string, any>): void {
		if (compiler.options.mode !== 'none') {
			this.config.dev = compiler.options.mode === 'development';
		}

		if (compiler.options.watch) {
			this.config.bundler.compiler.mangleSelectors = false;
		}

		this.config.bundler.watchFiles = compiler.options.watch;

		const bundler = new Bundler(this.config.bundler);

		bundler.bundle(this.config.bundles).catch((err) => console.error(err));

		compiler.hooks.beforeRun.tapPromise(StylifyWebpackPlugin.name, (): Promise<void> => {
			return bundler.waitOnBundlesProcessed();
		});

		compiler.hooks.watchRun.tapPromise(StylifyWebpackPlugin.name, (): Promise<void> => {
			return bundler.waitOnBundlesProcessed();
		});

		if (typeof this.config.afterApply === 'function') {
			this.config.afterApply(this, compiler);
		}
	}
}
