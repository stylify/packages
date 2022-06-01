import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { name, version } from '../package.json';
import {
	CompilerConfigInterface,
	nativePreset
} from '@stylify/stylify';
import { StylifyUnplugin } from '@stylify/unplugin';
import { BundlesBuildCacheInterface } from '@stylify/bundler';
import {
	defineNuxtModule,
	addPlugin,
	extendViteConfig,
	extendWebpackConfig,
	resolveAlias,
	requireModule
} from '@nuxt/kit';

export interface LoadersInterface {
	test: RegExp,
	include: string[]
}

export interface StylifyNuxtModuleConfigInterface {
	dev?: boolean,
	configPath?: string,
	compiler?: CompilerConfigInterface,
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
	filesMasks: string[],
	loaders?: LoadersInterface[],
	extend?: Partial<StylifyNuxtModuleConfigInterface>,
}

export interface ProcessedBundleInterface {
	css?: string,
}

export interface BundleStatsInterface {
	resourcePath: string,
	css: string
}

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

const mergeConfig = (
	actualConfig: StylifyNuxtModuleConfigInterface,
	config:StylifyNuxtModuleConfigInterface
): StylifyNuxtModuleConfigInterface => {
	if ('extend' in config) {
		actualConfig = mergeObject(actualConfig, config.extend);
		delete config.extend;
	}

	return {...actualConfig, ...config};
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const processedBundles: Record<string, ProcessedBundleInterface> = {};
const stylifyCssFileName = 'stylify.css';
const stylifyJsonFileName = 'stylify.json';

export default defineNuxtModule<StylifyNuxtModuleConfigInterface>({
	meta: {
		name,
		version,
		configKey: 'stylify'
	},
	defaults: (nuxt) => {
		const pagesDir = resolveAlias(nuxt.options.dir.pages);
		const layoutsDir = resolveAlias(nuxt.options.dir.layouts);
		const componentsDir = resolveAlias('components');
		const contentDir = resolveAlias('content');

		return {
			dev: false,
			configPath: 'stylify.config.js',
			compiler: nativePreset.compiler,
			cssVarsDirPath: null,
			sassVarsDirPath: null,
			lessVarsDirPath: null,
			stylusVarsDirPath: null,
			filesMasks: [
				path.join(nuxt.options.rootDir, 'app.vue'),
				path.join(nuxt.options.rootDir, pagesDir, '**', '*.vue'),
				path.join(nuxt.options.rootDir, layoutsDir, '**', '*.vue'),
				path.join(nuxt.options.rootDir, componentsDir, '**', '*.vue'),
				path.join(nuxt.options.rootDir, contentDir, '**', '*.vue'),
				path.join(nuxt.options.rootDir, contentDir, '**', '*.md')
			],
			loaders: [
				{
					test: /\.vue$/i,
					include: [pagesDir, layoutsDir, componentsDir, contentDir]
				},
				{
					test: /\.md$/i,
					include: [contentDir]
				}
			],
			extend: {}
		};
	},

	setup(moduleConfig, nuxt): void {
		const nuxtIsInDevMode = typeof nuxt.options.dev === 'boolean' ? nuxt.options.dev : moduleConfig.dev;

		moduleConfig.dev = nuxtIsInDevMode;

		if ('stylify' in nuxt.options) {
			mergeConfig(moduleConfig, moduleConfig);
		}

		const configPath = path.join(nuxt.options.rootDir, resolveAlias(moduleConfig.configPath));

		if (fs.existsSync(configPath)) {
			moduleConfig = mergeConfig(moduleConfig, requireModule(configPath));

			if (nuxtIsInDevMode) {
				nuxt.options.watch.push(configPath);
			}
		}

		moduleConfig.compiler.dev = moduleConfig.dev;
		moduleConfig.compiler.mangleSelectors = !moduleConfig.dev;
		moduleConfig.compiler.selectorsAreas = [
			'(?:^|\\s+)(?:v-bind)?:class="([^"]+)"',
			'(?:^|\\s+)(?:v-bind)?:class=\'([^\']+)\''
		];

		const runtimeDir = path.resolve(__dirname, 'runtime');
		const assetsDir = resolveAlias(nuxt.options.dir.assets);
		const assetsStylifyCssPath = path.join(nuxt.options.rootDir, assetsDir, stylifyCssFileName);

		nuxt.options.build.transpile.push(runtimeDir);

		if (moduleConfig.dev) {
			addPlugin({
				ssr: false,
				src: path.resolve(runtimeDir, 'plugins', 'profiler-plugin.client')
			});

			const headSnippet = `
				window.addEventListener('load', () => {
					const getStylifyBuildInfo = async () => {
						try {
							let response = await fetch('${assetsDir}/${stylifyJsonFileName}')

							const scriptEl = document.createElement('script');
							const stylifyBuildData = await response.json();
							scriptEl.innerHTML = JSON.stringify(stylifyBuildData);
							scriptEl.setAttribute('class', 'stylify-profiler-data');
							scriptEl.setAttribute('type', 'application/json');
							document.querySelector('body').append(scriptEl);
						} catch (e) {
							console.warn(e);
						}

						setTimeout(() => {
							getStylifyBuildInfo();
						}, 10000)
					};

					getStylifyBuildInfo();
				});
			`;

			nuxt.options.app.head.script = nuxt.options.app.head.script || [];
			nuxt.options.app.head.script.push({ children: headSnippet });
		}

		const bundleId = 'stylify';

		if (!fs.existsSync(assetsDir)) {
			fs.mkdirSync(assetsDir, { recursive: true });
		}

		if (!nuxt.options.css.includes(assetsStylifyCssPath)) {
			nuxt.options.css.push(assetsStylifyCssPath);
		}

		let nuxtBundleBuildCache: BundlesBuildCacheInterface = null;
		const transformIncludeFilterExtensions = [];
		const transformIncludeFilterDirectories = [];
		moduleConfig.filesMasks.forEach((fileMask: string) => {
			transformIncludeFilterExtensions.push(path.extname(fileMask));
			transformIncludeFilterDirectories.push(path.dirname(fileMask));
		});

		const convertObjectToStringableForm = (processedObject: Record<string, any>): Record<string, any> => {
			const newObject = {};

			for (const key in processedObject) {
				const processedValue = processedObject[key];

				const processedValueType = typeof processedValue;
				if (![null, true, false].includes(processedValue) && processedValueType === 'object') {
					newObject[key] = Array.isArray(processedValue)
						? processedValue
						: convertObjectToStringableForm(processedValue);
				} else if (processedValueType === 'function') {
					newObject[key] = `${processedValue.toString() as string}`;
				} else {
					newObject[key] = processedValue;
				}
			}

			return newObject;
		};

		const dumpProfilerInfo = (): void => {
			if (!nuxtIsInDevMode || !nuxtBundleBuildCache) {
				return;
			}

			const compiler = nuxtBundleBuildCache.compiler;
			const bundlesStats: BundleStatsInterface[] = [];

			for (const resourcePath in processedBundles) {
				bundlesStats.push({
					resourcePath: resourcePath,
					css: processedBundles[resourcePath].css
				});
			}

			const data = convertObjectToStringableForm({
				compilerExtension: {
					variables: compiler.variables,
					plainSelectors: compiler.plainSelectors,
					macros: compiler.macros,
					components: compiler.components,
					helpers: compiler.helpers,
					screens: compiler.screens
				},
				nuxtExtension: {
					bundlesStats: bundlesStats,
					serializedCompilationResult: JSON.stringify(
						nuxtBundleBuildCache.compilationResult.serialize()
					)
				}
			});
			fs.writeFileSync(path.join(nuxt.options.rootDir, assetsDir, stylifyJsonFileName), JSON.stringify(data));
		};

		const pluginConfig = {
			transformIncludeFilter: (id: string): boolean => {
				return transformIncludeFilterExtensions.includes(path.extname(id))
					&& transformIncludeFilterDirectories.includes(path.dirname(id));
			},
			bundles: [
				{
					id: bundleId,
					files: moduleConfig.filesMasks,
					rewriteSelectorsInFiles: false,
					outputFile: path.join(nuxt.options.rootDir, assetsDir, stylifyCssFileName),
					onBundleProcessed({bundleBuildCache}) {
						nuxtBundleBuildCache = bundleBuildCache;
						dumpProfilerInfo();
					}
				}
			],
			extend: {
				bundler: {
					cssVarsDirPath: moduleConfig.cssVarsDirPath
						? path.join(nuxt.options.rootDir, moduleConfig.cssVarsDirPath)
						: null,
					sassVarsDirPath: moduleConfig.sassVarsDirPath
						? path.join(nuxt.options.rootDir, moduleConfig.sassVarsDirPath)
						: null,
					lessVarsDirPath: moduleConfig.lessVarsDirPath
						? path.join(nuxt.options.rootDir, moduleConfig.lessVarsDirPath)
						: null,
					stylusVarsDirPath: moduleConfig.stylusVarsDirPath
						? path.join(nuxt.options.rootDir, moduleConfig.stylusVarsDirPath)
						: null,
					compiler: moduleConfig.compiler
				}
			}
		};

		extendWebpackConfig((config) => {
			const plugin = StylifyUnplugin.webpack(pluginConfig);
			config.plugins = config.plugins || [];
			config.plugins.push(plugin);
		});

		extendViteConfig((config) => {
			const plugin = StylifyUnplugin.vite(pluginConfig);
			config.plugins = config.plugins || [];
			config.plugins.push(plugin);
		});
	}
});
