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
	loaders?: LoadersInterface[]
}

export interface BundleStatsInterface {
	resourcePath: string,
	css: string
}

export interface ProcessedBundleInterface {
	css?: string,
}

let moduleConfig: StylifyNuxtModuleConfigInterface = {
	dev: false,
	configPath: 'stylify.config.js',
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

const processedBundles: Record<string, ProcessedBundleInterface> = {};

export default function Stylify(): void {
	const { nuxt } = this;

	const pagesDir = nuxt.resolver.resolveAlias(nuxt.options.dir.pages);
	const layoutsDir = nuxt.resolver.resolveAlias(nuxt.options.dir.layouts);
	const componentsDir = nuxt.resolver.resolveAlias('components');
	const contentDir = nuxt.resolver.resolveAlias('content');

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

	const nuxtIsInDevMode = typeof nuxt.options.dev === 'boolean' ? nuxt.options.dev : moduleConfig.dev;

	moduleConfig.dev = nuxtIsInDevMode;

	if ('stylify' in nuxt.options) {
		mergeConfig(nuxt.options.stylify);
	}

	const configPath = nuxt.resolver.resolveAlias(moduleConfig.configPath);

	if (fs.existsSync(configPath)) {
		mergeConfig(nuxt.resolver.requireModule(configPath));

		if (nuxtIsInDevMode) {
			nuxt.options.watch.push(configPath);
		}
	}

	moduleConfig.compiler.dev = moduleConfig.dev;
	moduleConfig.compiler.mangleSelectors = true;
	moduleConfig.compiler.selectorsAreas = [
		'(?:^|\\s+)(?:v-bind)?:class="([^"]+)"',
		'(?:^|\\s+)(?:v-bind)?:class=\'([^\']+)\''
	];

	if (moduleConfig.dev) {
		this.addPlugin({
			ssr: false,
			src: path.resolve(__dirname, 'profiler-plugin.js')
		});
	}

	const getCompiler = () => new Compiler(moduleConfig.compiler);
	const compiler = getCompiler();

	this.extendBuild((config: Record<string, any>): void => {
		config.module.rules.push({
			test: /\.jsx?$/,
			include: [
				path.resolve('node_modules/@stylify/profiler'),
				path.resolve('node_modules/@stylify/stylify')
			],
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
						loader: path.join(__dirname, 'webpack-loader.js'),
						options: {
							getCompiler: getCompiler,
							getCompilationResult: (): CompilationResult|null => {
								return compilationResult;
							}
						}
					}
				});
			}
		}

	});

	const convertObjectToStringableForm = (processedObject: Record<string, any>): Record<string, any> => {
		const newObject = {};

		for (const key in processedObject) {
			const processedValue = processedObject[key];

			if (processedValue !== null
				&& processedValue !== true
				&& processedValue !== false
				&& typeof processedValue === 'object'
			) {
				newObject[key] = Array.isArray(processedValue)
					? processedValue
					: convertObjectToStringableForm(processedValue);
			} else if (typeof processedValue === 'function') {
				newObject[key] = `${processedValue.toString() as string}`;
			} else {
				newObject[key] = processedValue;
			}
		}

		return newObject;
	};

	const dumpProfilerInfo = (params: Record<string, any>): void => {
		if (!nuxtIsInDevMode || !compilationResult) {
			return;
		}

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
				serializedCompilationResult: JSON.stringify(compilationResult.serialize())
			}
		});

		params.HEAD += `<script class="stylify-profiler-data" type="application/json">${JSON.stringify(data)}</script>`;
	};

	let initStyleGenerated = false;
	const generateStylifyCssFile = async () => {
		const assetsDir = nuxt.resolver.resolveAlias(nuxt.options.dir.assets);
		const assetsStylifyCssPath = path.join('~', nuxt.options.dir.assets, 'stylify.css');
		const bundleId = 'stylify';

		if (!fs.existsSync(assetsDir)) {
			fs.mkdirSync(assetsDir);
		}

		const bundler = new Bundler({
			compiler: moduleConfig.compiler,
			cssVarsDirPath: moduleConfig.cssVarsDirPath,
			sassVarsDirPath: moduleConfig.sassVarsDirPath,
			lessVarsDirPath: moduleConfig.lessVarsDirPath,
			stylusVarsDirPath: moduleConfig.stylusVarsDirPath
		});

		await bundler.bundle([
			{
				id: bundleId,
				files: moduleConfig.filesMasks,
				rewriteSelectorsInFiles: false,
				outputFile: path.join(assetsDir, 'stylify.css')
			}
		]);

		compilationResult = bundler.findBundleCache(bundleId).compilationResult;

		processedBundles[bundleId] = {
			css: compilationResult.generateCss()
		};

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

	nuxt.hook('vue-renderer:ssr:templateParams', (params: Record<string, any>): void => {
		dumpProfilerInfo(params);
	});
}
