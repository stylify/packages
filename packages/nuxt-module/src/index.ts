import {
	Compiler,
	CompilerConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import { Bundler, hooks as bundlerHooks } from '@stylify/bundler';
import fs from 'fs';
import path from 'path';

export interface LoadersInterface {
	test: RegExp,
	include: string[]
}

export interface StylifyNuxtModuleConfigInterface {
	dev?: boolean,
	configPath?: string,
	compiler?: CompilerConfigInterface,
	cssVarsExportPath?: string,
	sassVarsExportPath?: string,
	lessVarsExportPath?: string,
	stylusVarsExportPath?: string,
	filesMasks?: string[],
	loaders?: LoadersInterface[],
}

export interface BundleStatsInterface {
	resourcePath: string,
	css: string
}

export interface ProcessedBundleInterface {
	css?: string,
}

export const hooks = bundlerHooks;

const filesSuffix = (/lib\/?$/).test(__dirname) ? 'cjs' : 'mjs';

let moduleConfig: StylifyNuxtModuleConfigInterface = {
	dev: false,
	configPath: null,
	compiler: {},
	cssVarsExportPath: null,
	sassVarsExportPath: null,
	lessVarsExportPath: null,
	stylusVarsExportPath: null,
	filesMasks: [],
	loaders: []
};

const stylifyCssFileName = 'stylify.css';

export const defineConfig = (config: StylifyNuxtModuleConfigInterface): StylifyNuxtModuleConfigInterface => config;

export default function Stylify(): void {
	const { nuxt } = this;

	const rootDir: string = nuxt.options.rootDir;
	const pagesDir: string = nuxt.resolver.resolveAlias(nuxt.options.dir.pages);
	const layoutsDir: string = nuxt.resolver.resolveAlias(nuxt.options.dir.layouts);
	const componentsDir: string = nuxt.resolver.resolveAlias('components');
	const contentDir: string = nuxt.resolver.resolveAlias('content');

	moduleConfig.filesMasks = [
		`${pagesDir}/**/*.vue`,
		`${layoutsDir}/**/*.vue`,
		`${componentsDir}/**/*.{vue,js,ts}`,
		`${contentDir}/**/*.{vue,md}`,
		`${rootDir}/plugins/**/*.{js,ts}`
	];

	moduleConfig.loaders = [
		{
			test: /\.vue$/i,
			include: [pagesDir, layoutsDir, componentsDir, contentDir]
		},
		{
			test: /\.md$/i,
			include: [contentDir]
		}
	];

	const nuxtIsInDevMode = nuxt.options.dev ?? moduleConfig.dev;

	moduleConfig.dev = nuxtIsInDevMode;

	if ('stylify' in nuxt.options) {
		moduleConfig = mergeObjects(moduleConfig, nuxt.options.stylify as StylifyNuxtModuleConfigInterface);
	}

	const getConfigPath = (configPath: string) => nuxt.resolver.resolveAlias(configPath) as string;
	const configsPaths = [
		getConfigPath('stylify.config.js'),
		getConfigPath('stylify.config.mjs'),
		getConfigPath('stylify.config.cjs'),
		getConfigPath('stylify.config.ts')
	];

	let configFileExists = false;

	if (moduleConfig.configPath) {
		const configPath = getConfigPath(moduleConfig.configPath);
		configFileExists = fs.existsSync(configPath);

		if (configFileExists) {
			configsPaths.push(configPath);
		} else {
			console.error(`Stylify: Given config "${moduleConfig.configPath}" was not found. Skipping.`);
		}
	}

	for (const configPath of configsPaths) {
		if (!fs.existsSync(configPath)) {
			continue;
		}

		moduleConfig = mergeObjects(
			moduleConfig, nuxt.resolver.requireModule(configPath) as Partial<StylifyNuxtModuleConfigInterface>
		);

		if (nuxtIsInDevMode) {
			nuxt.options.watch = nuxt.options.watch ?? [];
			nuxt.options.watch.push(configPath);
		}
	}

	moduleConfig.compiler.dev = moduleConfig.dev;
	moduleConfig.compiler.mangleSelectors = !moduleConfig.dev;

	const bundleId = 'stylify-default';
	const createBundlerInstance = (): Bundler => {
		return new Bundler({
			compiler: moduleConfig.compiler,
			cssVarsExportPath: moduleConfig.cssVarsExportPath,
			sassVarsExportPath: moduleConfig.sassVarsExportPath,
			lessVarsExportPath: moduleConfig.lessVarsExportPath,
			stylusVarsExportPath: moduleConfig.stylusVarsExportPath
		});
	};

	let bundler = createBundlerInstance();

	const getCompiler = (): Compiler|null => {
		const cache = bundler.findBundleCache(bundleId);
		return cache ? cache.compiler : null;
	};

	this.extendBuild((config: Record<string, any>): void => {
		config.module.rules.push({
			test: /\.jsx?$/,
			include: [path.resolve('node_modules/@stylify/stylify')],
			use: {
				loader: 'babel-loader',
				options: {
					presets: [
						['@babel/preset-env', { targets: 'defaults' }]
					]
				}
			}
		});

		if (!nuxtIsInDevMode) {
			for (const loaderConfig of moduleConfig.loaders) {
				config.module.rules.push({
					test: loaderConfig.test,
					enforce: 'pre',
					include: loaderConfig.include,
					use: {
						loader: path.join(__dirname, `webpack-loader.${filesSuffix}`),
						options: {
							getCompiler: getCompiler
						}
					}
				});
			}
		}
	});

	let initStyleGenerated = false;
	const generateStylifyCssFile = async () => {
		const assetsDir: string = nuxt.resolver.resolveAlias(nuxt.options.dir.assets);
		const assetsStylifyCssPath = path.join('~', nuxt.options.dir.assets as string, stylifyCssFileName);

		if (!fs.existsSync(assetsDir)) {
			fs.mkdirSync(assetsDir, { recursive: true });
		}

		if (nuxtIsInDevMode) {
			bundler = createBundlerInstance();
		}

		await bundler.bundle([
			{
				id: bundleId,
				files: moduleConfig.filesMasks,
				outputFile: path.join(assetsDir, stylifyCssFileName)
			}
		]);

		if (!nuxt.options.css.includes(assetsStylifyCssPath)) {
			nuxt.options.css.push(assetsStylifyCssPath);
		}

		initStyleGenerated = true;
	};

	nuxt.hook('content:file:beforeParse', async (): Promise<void> => {
		if (!initStyleGenerated) {
			return;
		}

		return generateStylifyCssFile();
	});

	nuxt.hook('build:before', async (): Promise<void> => {
		return generateStylifyCssFile();
	});

	nuxt.hook('bundler:change', async (): Promise<void> => {
		return generateStylifyCssFile();
	});

	nuxt.hook('vue-renderer:ssr:templateParams', async (): Promise<void> => {
		await bundler.waitOnBundlesProcessed();
	});

}
