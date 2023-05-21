import fs from 'fs';
import path from 'path';
import { name } from '../package.json';
import {
	CompilerConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import { default as normalize } from 'normalize-path';
import {
	stylifyWebpack,
	stylifyVite,
	defineConfig as defineUnpluginConfig,
	hooks as unpluginHooks,
	UnpluginConfigInterface
} from '@stylify/unplugin';
import type { NuxtModule } from '@nuxt/schema';
import {
	defineNuxtModule,
	resolveAlias,
	findPath,
	addWebpackPlugin,
	addVitePlugin
} from '@nuxt/kit';

export interface NuxtModuleConfigInterface {
	dev?: boolean,
	configPath?: string,
	compiler?: CompilerConfigInterface,
	cssVarsExportPath?: string,
	sassVarsExportPath?: string,
	lessVarsExportPath?: string,
	stylusVarsExportPath?: string,
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

export const hooks = unpluginHooks;

export const defineConfig = (config: NuxtModuleConfigInterface): NuxtModuleConfigInterface => config;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
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
			cssVarsExportPath: null,
			sassVarsExportPath: null,
			lessVarsExportPath: null,
			stylusVarsExportPath: null,
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

		const configFiles = (await Promise.all([
			findPath('stylify.config.js'),
			findPath('stylify.config.mjs'),
			findPath('stylify.config.cjs')
		])).filter((config) => config !== null);

		if (moduleConfig.configPath) {
			moduleConfig.configPath = await findPath(moduleConfig.configPath);

			if (fs.existsSync(moduleConfig.configPath)) {
				configFiles.push(moduleConfig.configPath);

			} else {
				console.error(`Stylify: Given config "${moduleConfig.configPath}" was not found. Skipping.`);
			}
		}

		moduleConfig.compiler.dev = moduleConfig.dev;

		const assetsDir = resolveAlias(nuxt.options.dir.assets);
		const assetsStylifyCssPath = normalize(path.join(assetsDir, stylifyCssFileName)) as string;

		if (!fs.existsSync(assetsDir)) {
			fs.mkdirSync(assetsDir, { recursive: true });
		}

		if (!nuxt.options.css.includes(assetsStylifyCssPath)) {
			nuxt.options.css.push(assetsStylifyCssPath);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		const getPluginConfig = (): UnpluginConfigInterface => defineUnpluginConfig({
			configFile: configFiles,
			dev: nuxtIsInDevMode,
			bundles: [{
				id: 'stylify-default',
				files: moduleConfig.filesMasks,
				outputFile: path.join(assetsDir, stylifyCssFileName)
			}],
			bundler: {
				cssVarsExportPath: moduleConfig.cssVarsExportPath
					? path.join(nuxt.options.rootDir, moduleConfig.cssVarsExportPath)
					: null,
				sassVarsExportPath: moduleConfig.sassVarsExportPath
					? path.join(nuxt.options.rootDir, moduleConfig.sassVarsExportPath)
					: null,
				lessVarsExportPath: moduleConfig.lessVarsExportPath
					? path.join(nuxt.options.rootDir, moduleConfig.lessVarsExportPath)
					: null,
				stylusVarsExportPath: moduleConfig.stylusVarsExportPath
					? path.join(nuxt.options.rootDir, moduleConfig.stylusVarsExportPath)
					: null,
				compiler: moduleConfig.compiler
			}
		});

		nuxt.hook('build:before', () => {
			// eslint-disable-next-line no-console
			console.info(`Stylify is running with config${configFiles.length > 1 ? 's' : ''} "${configFiles.join(', ')}".`);
		});

		addWebpackPlugin(stylifyWebpack(getPluginConfig()));
		addVitePlugin(stylifyVite(getPluginConfig()));
	}
}) as NuxtModule<NuxtModuleConfigInterface>;
