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
	resolveAlias,
	requireModule,
	findPath,
	addWebpackPlugin,
	addVitePlugin
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
		const rootDir = nuxt.options.rootDir;

		return {
			dev: false,
			configPath: null,
			compiler: {},
			cssVarsDirPath: null,
			sassVarsDirPath: null,
			lessVarsDirPath: null,
			stylusVarsDirPath: null,
			filesMasks: [
				`${rootDir}/components/**/*.{vue,js,ts}`,
				`${rootDir}/layouts/**/*.vue`,
				`${rootDir}/pages/**/*.vue`,
				`${rootDir}/composables/**/*.{js,ts}`,
				`${rootDir}/content/**/*.{vue,md}`,
				`${rootDir}/plugins/**/*.{js,ts}`,
				`${rootDir}/App.{js,ts,vue}`,
				`${rootDir}/app.{js,ts,vue}`,
				`${rootDir}/Error.{js,ts,vue}`,
				`${rootDir}/error.{js,ts,vue}`
			]
		};
	},

	async setup(moduleConfig, nuxt): Promise<void> {
		const nuxtIsInDevMode = nuxt.options.dev ?? moduleConfig.dev;
		moduleConfig.dev = nuxtIsInDevMode;

		if ('stylify' in nuxt.options) {
			// eslint-disable-next-line no-extra-parens
			moduleConfig = mergeObjects(moduleConfig, (<any>nuxt).options.stylify ?? {});
		}

		const configsPaths = (await Promise.all([
			findPath('stylify.config.js'),
			findPath('stylify.config.mjs'),
			findPath('stylify.config.cjs'),
			findPath('stylify.config.ts')
		])).filter((config) => config !== null);

		if (moduleConfig.configPath) {
			moduleConfig.configPath = await findPath(moduleConfig.configPath);

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

			moduleConfig = mergeObjects(
				moduleConfig, requireModule(configPath, { clearCache: true }) as Partial<NuxtModuleConfigInterface>
			);

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

		nuxt.hook('build:before', () => {
			// eslint-disable-next-line no-console
			console.info(`Stylify: is running with configs "${configsPaths.join(', ')}".`);
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
					id: 'nuxtRollup',
					dev: nuxtIsInDevMode,
					compiler: {
						selectorsAreas: ['"className":\\[([^\\]]+)\\]']
					}
				}
			);

			nitroConfig.rollupConfig.plugins.unshift(stylifyRollup(pluginConfig));
		});

		addWebpackPlugin(stylifyWebpack(getPluginConfig()));
		addVitePlugin(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			stylifyVite(getPluginConfig())
		);
	}
});
