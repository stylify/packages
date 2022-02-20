import { BundleConfigInterface, BundlerConfigInterface, Bundler, BundlesBuildCacheInterface } from '@stylify/bundler';
import { nativePreset, CompilationResult, Compiler, ComponentsInterface } from '@stylify/stylify';
import { createUnplugin } from 'unplugin';

export interface StylifyUnpluginConfigInterface {
	bundles: BundleConfigInterface[];
	dev?: boolean;
	bundler?: BundlerConfigInterface;
	transformIncludeFilter?: (id: string) => boolean;
	extend?: Partial<StylifyUnpluginConfigInterface>;
}

export const StylifyUnplugin = createUnplugin((config: StylifyUnpluginConfigInterface) => {

	const pluginName = 'stylify';

	let pluginConfig: StylifyUnpluginConfigInterface = {
		dev: null,
		bundles: [],
		bundler: {
			compiler: nativePreset.compiler
		},
		transformIncludeFilter: null
	};

	const mergeObject = (...objects): any => {
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
						newObject[processedObjectKey] = mergeObject(newObject[processedObjectKey], newValue);
						continue;
					}
				}

				newObject[processedObjectKey] = newValue;
			}
		}

		return newObject;
	};

	const getBundler = (): Bundler => {
		if (pluginConfig.dev || !bundler) {
			const bundlerConfig = {
				...pluginConfig.bundler,
				...{ bundles: pluginConfig.bundles}
			};
			bundler = new Bundler(bundlerConfig);
		}

		return bundler;
	};


	if ('extend' in config) {
		pluginConfig = mergeObject(pluginConfig, config.extend);
		delete config.extend;
	}

	pluginConfig = {...pluginConfig, ...config};

	let bundler: Bundler = null;

	const runBundlerOrWait = async () => {
		if (bundler) {
			return bundler.waitOnBundlesProcessed();
		}

		const localBundler = getBundler();

		await Promise.all([
			localBundler.bundle(),
			localBundler.waitOnBundlesProcessed()
		]);
	};

	return {
		name: pluginName,
		transformInclude(id) {
			return typeof pluginConfig.transformIncludeFilter === 'function'
				? pluginConfig.transformIncludeFilter(id)
				: true;
		},
		async transform(code): Promise<string> {
			const bundler = getBundler();
			await bundler.bundle();
			await bundler.waitOnBundlesProcessed();

			if (pluginConfig.dev) {
				return code;
			}

			const selectors = {};
			const components: Record<string, ComponentsInterface> = {};
			const ignoredElements = [];

			const bundlesBuildCache: BundlesBuildCacheInterface[] = Object.values(bundler.bundlesBuildCache);
			for (const bundleBuildCache of bundlesBuildCache) {
				for (const ignoredElement of bundleBuildCache.compiler.ignoredElements) {
					if (!ignoredElement.includes(ignoredElement)) {
						ignoredElements.push(ignoredElement);
					}
				}

				for (const selector in bundleBuildCache.compilationResult.selectorsList) {
					if (!(selector in selectors)) {
						selectors[selector] = {selector: selector};
					}
				}

				for (const component in bundleBuildCache.compiler.components) {
					if (!(component in components)) {
						components[component] = bundleBuildCache.compiler.components[component];
					}
				}
			}

			const rewrittenCode = new Compiler({
				ignoredElements: ignoredElements,
				components: components
			}).rewriteSelectors(
				code,
				new CompilationResult({
					selectorsList: selectors,
					componentsList: Object.keys(components)
				})
			);
			return rewrittenCode;
		},
		rollup: {
			async options(): Promise<void> {
				if (pluginConfig.dev === null && typeof process['NODE_ENV'] !== 'undefined') {
					pluginConfig.dev = process['NODE_ENV'] !== 'test';
				}

				pluginConfig.bundler.watchFiles = pluginConfig.dev;
				pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev;

				return runBundlerOrWait();
			}
		},
		vite: {
			configResolved(config): void {
				if (pluginConfig.dev === null) {
					pluginConfig.dev = !config.isProduction;
				}

				pluginConfig.bundler.watchFiles = pluginConfig.dev;
				pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev;
				pluginConfig.bundles = pluginConfig.bundles.map((bundle) => {
					bundle.rewriteSelectorsInFiles = false;
					return bundle;
				});
			}
		},
		webpack(compiler) {
			if (pluginConfig.dev === null && compiler.options.mode !== 'none') {
				pluginConfig.dev = compiler.options.mode === 'development';
			}

			pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev && !compiler.options.watch;
			pluginConfig.bundler.watchFiles = compiler.options.watch;

			compiler.hooks.beforeRun.tapPromise(pluginName, (): Promise<void> => {
				return runBundlerOrWait();
			});

			compiler.hooks.watchRun.tapPromise(pluginName, (): Promise<void> => {
				return runBundlerOrWait();
			});
		}
	};
});
