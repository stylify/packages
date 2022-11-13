import fs from 'fs';
import path from 'path';
import { name } from '../package.json';
import {
	CompilerConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import {
	stylifyRollup,
	stylifyWebpack,
	stylifyVite,
	defineConfig as defineUnpluginConfig,
	UnpluginConfigInterface
} from '@stylify/unplugin';
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
	filesMasks?: string[]
}

export interface ProcessedBundleInterface {
	css?: string,
}

export interface BundleStatsInterface {
	resourcePath: string,
	css: string
}

const stylifyCssFileName = 'stylify.css';

export const defineConfig = (config: NuxtModuleConfigInterface): NuxtModuleConfigInterface => config;

export default defineNuxtModule<NuxtModuleConfigInterface>({
	meta: {
		name,
		configKey: 'stylify'
	},
	defaults: (nuxt): NuxtModuleConfigInterface => {
		const pagesDir = resolveAlias(nuxt.options.dir.pages);
		const layoutsDir = resolveAlias(nuxt.options.dir.layouts);
		const componentsDir = resolveAlias('components');
		const contentDir = resolveAlias('content');

		return {
			dev: false,
			configPath: null,
			compiler: {},
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
			]
		};
	},

	setup(moduleConfig, nuxt): void {
		const nuxtIsInDevMode = nuxt.options.dev ?? moduleConfig.dev;
		moduleConfig.dev = nuxtIsInDevMode;

		if ('stylify' in nuxt.options) {
			// eslint-disable-next-line no-extra-parens
			moduleConfig = mergeObjects(moduleConfig, (<any>nuxt).options.stylify ?? {});
		}

		const getConfigPath = (configPath: string): string => path.join(nuxt.options.rootDir, resolveAlias(configPath));
		const configsPaths = [getConfigPath('stylify.config.js'), getConfigPath('stylify.config.ts')];

		if (moduleConfig.configPath) {
			moduleConfig.configPath = getConfigPath(moduleConfig.configPath);

			if (fs.existsSync(moduleConfig.configPath)) {
				configsPaths.push(moduleConfig.configPath);

			} else {
				console.error(`Stylify: Given config "${moduleConfig.configPath}" was not found. Skipping.`);
			}
		}

		for (const configPath of configsPaths) {
			if (!fs.existsSync(configPath)) {
				continue;
			}

			moduleConfig = mergeObjects(moduleConfig, requireModule(configPath) as Partial<NuxtModuleConfigInterface>);

			if (nuxtIsInDevMode) {
				nuxt.options.watch = nuxt.options.watch ?? [];
				nuxt.options.watch.push(configPath);
			}
		}

		moduleConfig.compiler.dev = moduleConfig.dev;
		moduleConfig.compiler.mangleSelectors = !moduleConfig.dev;

		const runtimeDir = path.join(
			typeof __dirname === 'undefined' ? path.dirname(fileURLToPath(import.meta.url)) : __dirname, 'runtime'
		);

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

		moduleConfig.filesMasks.forEach((fileMask: string) => {
			transformIncludeFilterExtensions.push(path.extname(fileMask));
		});

		const getPluginConfig = (): UnpluginConfigInterface => defineUnpluginConfig({
			transformIncludeFilter: (id: string): boolean => {
				return transformIncludeFilterExtensions.includes(path.extname(id));
			},
			dev: nuxtIsInDevMode,
			bundles: [{
				files: moduleConfig.filesMasks,
				rewriteSelectorsInFiles: false,
				outputFile: path.join(nuxt.options.rootDir, assetsDir, stylifyCssFileName)
			}],
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
		});

		/**
		 * This is here, because the Nitro hook content:file:parseBefore
		 * doesn't work when added in nitro:init hook to Nitro instance and can be called only,
		 * within the Nitro plugin that cannot be a function for some reason. Therefore the Rollup plugin
		 * is added into the Nitro build process and mangles classes in compiled markdown files
		 * that have json format ¯\_(ツ)_/¯
		 */
		nuxt.hook('nitro:config', (nitroConfig) => {
			const pluginConfig = mergeObjects(
				getPluginConfig(),
				{
					dev: nuxtIsInDevMode,
					compiler: {
						selectorsAreas: ['"className":\\[([^\\]]+)\\]']
					}
				}
			);
			nitroConfig.rollupConfig.plugins.unshift(stylifyRollup(pluginConfig));
		});

		extendWebpackConfig((config) => {
			const plugin = stylifyWebpack(getPluginConfig());
			config.plugins = config.plugins || [];
			config.plugins.push(plugin);
		});

		extendViteConfig((config) => {
			const plugin = stylifyVite(getPluginConfig());
			config.plugins = config.plugins || [];
			config.plugins.push(plugin);
		});
	}
});
