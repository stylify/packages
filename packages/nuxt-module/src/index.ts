import {
	CompilationResult,
	Compiler,
	CompilerConfigInterface,
	nativePreset
} from '@stylify/stylify';
import { Bundler } from '@stylify/bundler';
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
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
	filesMasks: string[],
	loaders?: LoadersInterface[],
	extend?: Partial<StylifyNuxtModuleConfigInterface>,
}

export interface BundleStatsInterface {
	resourcePath: string,
	css: string
}

export interface ProcessedBundleInterface {
	css?: string,
}

const filesSuffix = (/lib\/?$/).test(__dirname) ? 'cjs' : 'mjs';

let moduleConfig: StylifyNuxtModuleConfigInterface = {
	dev: false,
	configPath: null,
	compiler: nativePreset.compiler,
	cssVarsDirPath: null,
	sassVarsDirPath: null,
	lessVarsDirPath: null,
	stylusVarsDirPath: null,
	filesMasks: [],
	loaders: []
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

const mergeConfig = (config: Record<string, any>): void => {
	if ('extend' in config) {
		moduleConfig = mergeObject(moduleConfig, config.extend);
		delete config.extend;
	}

	moduleConfig = {...moduleConfig, ...config};
};

let compilationResult: CompilationResult = null;

export const defineConfig = (config: StylifyNuxtModuleConfigInterface): StylifyNuxtModuleConfigInterface => config;

export default function Stylify(): void {
	const { nuxt } = this;

	const pagesDir: string = nuxt.resolver.resolveAlias(nuxt.options.dir.pages);
	const layoutsDir: string = nuxt.resolver.resolveAlias(nuxt.options.dir.layouts);
	const componentsDir: string = nuxt.resolver.resolveAlias('components');
	const contentDir: string = nuxt.resolver.resolveAlias('content');

	moduleConfig.filesMasks = [
		path.join(pagesDir, '**', '*.vue'),
		path.join(layoutsDir, '**', '*.vue'),
		path.join(componentsDir, '**', '*.vue'),
		path.join(contentDir, '**', '*.vue'),
		path.join(contentDir, '**', '*.md')
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
		mergeConfig(nuxt.options.stylify as StylifyNuxtModuleConfigInterface);
	}

	let configFileExists = false;

	if (moduleConfig.configPath) {
		moduleConfig.configPath = nuxt.resolver.resolveAlias(moduleConfig.configPath);
		configFileExists = fs.existsSync(moduleConfig.configPath);

		if (!configFileExists) {
			console.error(`Stylify: Given config "${moduleConfig.configPath}" was not found. Skipping.`);
		}

	} else {
		const jsConfigPath: string = nuxt.resolver.resolveAlias('stylify.config.js');
		configFileExists = fs.existsSync(jsConfigPath);

		if (configFileExists) {
			moduleConfig.configPath = jsConfigPath;

		} else {
			const tsConfigPath: string = nuxt.resolver.resolveAlias('stylify.config.ts');
			configFileExists = fs.existsSync(tsConfigPath);

			if (configFileExists) {
				moduleConfig.configPath = tsConfigPath;
			}
		}
	}

	if (configFileExists) {
		const configFromFile: Partial<StylifyNuxtModuleConfigInterface> = nuxt.resolver.requireModule(
			moduleConfig.configPath
		);

		mergeConfig(configFromFile);

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

	const bundleId = 'stylify';
	const createBundlerInstance = (): Bundler => {
		return new Bundler({
			compiler: moduleConfig.compiler,
			cssVarsDirPath: moduleConfig.cssVarsDirPath,
			sassVarsDirPath: moduleConfig.sassVarsDirPath,
			lessVarsDirPath: moduleConfig.lessVarsDirPath,
			stylusVarsDirPath: moduleConfig.stylusVarsDirPath
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
							getCompiler: getCompiler,
							getCompilationResult: (): CompilationResult => compilationResult
						}
					}
				});
			}
		}

	});

	let initStyleGenerated = false;
	const generateStylifyCssFile = async () => {
		const assetsDir: string = nuxt.resolver.resolveAlias(nuxt.options.dir.assets);
		const assetsStylifyCssPath = path.join('~', nuxt.options.dir.assets as string, 'stylify.css');

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
				rewriteSelectorsInFiles: false,
				outputFile: path.join(assetsDir, 'stylify.css')
			}
		]);

		compilationResult = bundler.findBundleCache(bundleId).compilationResult;

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
