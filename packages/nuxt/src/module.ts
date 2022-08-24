import fs from 'fs';
import path from 'path';
import { name } from '../package.json';
import {
	CompilerConfigInterface,
	nativePreset
} from '@stylify/stylify';
import { unplugin, defineConfig as defineUnpluginConfig, UnpluginConfigInterface } from '@stylify/unplugin';
import {
	defineNuxtModule,
	extendViteConfig,
	extendWebpackConfig,
	resolveAlias,
	requireModule
} from '@nuxt/kit';
import { fileURLToPath } from 'url';

export interface NuxtModuleConfigInterface {
	dev?: boolean,
	configPath?: string,
	compiler?: CompilerConfigInterface,
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
	filesMasks: string[],
	extend?: Partial<NuxtModuleConfigInterface>,
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
	actualConfig: NuxtModuleConfigInterface,
	config: Record<string, any>
): NuxtModuleConfigInterface => {
	if ('extend' in config) {
		actualConfig = mergeObject(actualConfig, config.extend);
		delete config.extend;
	}

	return {...actualConfig, ...config};
};

const stylifyCssFileName = 'stylify.css';

export const defineConfig = (config: NuxtModuleConfigInterface): NuxtModuleConfigInterface => config;

export default defineNuxtModule<NuxtModuleConfigInterface>({
	meta: {
		name,
		configKey: 'stylify'
	},
	defaults: (nuxt) => {
		const pagesDir = resolveAlias(nuxt.options.dir.pages);
		const layoutsDir = resolveAlias(nuxt.options.dir.layouts);
		const componentsDir = resolveAlias('components');
		const contentDir = resolveAlias('content');

		return {
			dev: false,
			configPath: null,
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
			extend: {}
		};
	},

	setup(moduleConfig, nuxt): void {
		const nuxtIsInDevMode = nuxt.options.dev ?? moduleConfig.dev;

		moduleConfig.dev = nuxtIsInDevMode;

		if ('stylify' in nuxt.options) {
			mergeConfig(moduleConfig, moduleConfig);
		}

		let configFileExists = false;

		if (moduleConfig.configPath) {
			moduleConfig.configPath = path.join(nuxt.options.rootDir, resolveAlias(moduleConfig.configPath));
			configFileExists = fs.existsSync(moduleConfig.configPath);

			if (!configFileExists) {
				console.error(`Stylify: Given config "${moduleConfig.configPath}" was not found. Skipping.`);
			}

		} else {
			const jsConfigPath = path.join(nuxt.options.rootDir, resolveAlias('stylify.config.js'));
			configFileExists = fs.existsSync(jsConfigPath);

			if (configFileExists) {
				moduleConfig.configPath = jsConfigPath;

			} else {
				const tsConfigPath = path.join(nuxt.options.rootDir, resolveAlias('stylify.config.ts'));
				configFileExists = fs.existsSync(tsConfigPath);

				if (configFileExists) {
					moduleConfig.configPath = tsConfigPath;
				}
			}
		}

		if (configFileExists) {
			const config: Partial<NuxtModuleConfigInterface> = requireModule(moduleConfig.configPath);
			moduleConfig = mergeConfig(moduleConfig, config);

			if (nuxtIsInDevMode) {
				nuxt.options.watch.push(moduleConfig.configPath);
			}
		}

		moduleConfig.compiler.dev = moduleConfig.dev;
		moduleConfig.compiler.mangleSelectors = !moduleConfig.dev;
		moduleConfig.compiler.selectorsAreas = [
			'(?:^|\\s+)(?:v-bind)?:class="([^"]+)"',
			'(?:^|\\s+)(?:v-bind)?:class=\'([^\']+)\''
		];

		const runtimeDir = path.join(__dirname ?? path.dirname(fileURLToPath(import.meta.url)), 'runtime');
		const assetsDir = resolveAlias(nuxt.options.dir.assets);
		const assetsStylifyCssPath = path.join(nuxt.options.rootDir, assetsDir, stylifyCssFileName);

		nuxt.options.build.transpile.push(runtimeDir);

		if (!fs.existsSync(assetsDir)) {
			fs.mkdirSync(assetsDir, { recursive: true });
		}

		if (!nuxt.options.css.includes(assetsStylifyCssPath)) {
			nuxt.options.css.push(assetsStylifyCssPath);
		}

		const transformIncludeFilterExtensions = [];
		const transformIncludeFilterDirectories = [];

		moduleConfig.filesMasks.forEach((fileMask: string) => {
			transformIncludeFilterExtensions.push(path.extname(fileMask));
			transformIncludeFilterDirectories.push(path.dirname(fileMask));
		});

		const getPluginConfig = (): UnpluginConfigInterface => defineUnpluginConfig({
			transformIncludeFilter: (id: string): boolean => {
				return transformIncludeFilterExtensions.includes(path.extname(id));
			},
			dev: nuxtIsInDevMode,
			bundles: [
				{
					files: moduleConfig.filesMasks,
					rewriteSelectorsInFiles: false,
					outputFile: path.join(nuxt.options.rootDir, assetsDir, stylifyCssFileName)
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
		});

		/**
		 * This is here, because the Nittro hook content:file:parseBefore
		 * doesn't work when added in nittro:init hook to Nittro instance and can be called only,
		 * within the Nittro plugin that cannot be a function for some reason. Therefore the Rollup plugin
		 * is added into the Nittro build process and mangles classes in compiled markdown files
		 * that have json format ¯\_(ツ)_/¯
		 */
		nuxt.hook('nitro:config', (nitroConfig) => {
			const pluginConfig = getPluginConfig();
			pluginConfig.extend.bundler.compiler.selectorsAreas.push('"className":\\[([^\\]]+)\\]');
			pluginConfig.dev = nuxtIsInDevMode;
			nitroConfig.rollupConfig.plugins.unshift(unplugin.rollup(pluginConfig));
		});

		extendWebpackConfig((config) => {
			const plugin = unplugin.webpack(getPluginConfig());
			config.plugins = config.plugins || [];
			config.plugins.push(plugin);
		});

		extendViteConfig((config) => {
			const plugin = unplugin.vite(getPluginConfig());
			config.plugins = config.plugins || [];
			config.plugins.push(plugin);
		});
	}
});
