import {
	CompilationResult,
	Compiler,
	CompilerConfigInterface,
	nativePreset
} from '@stylify/stylify';
import fs from 'fs';
import path from 'path';

export interface StylifyNuxtModuleConfigInterface {
	dev?: boolean,
	configPath?: string,
	compiler?: CompilerConfigInterface,
	loader?: {
		test?: RegExp,
		exclude?: any
	}
}

export interface BundleStatsInterface {
	resourcePath: string,
	css: string
}

let moduleConfig: StylifyNuxtModuleConfigInterface = {
	dev: false,
	configPath: 'stylify.config.js',
	compiler: nativePreset.compiler,
	loader: {
		test: /\.vue$/i,
		exclude: /node_modules/
	}
};

const mergeObject = (...objects): any => {
	const newObject = {};

	for (const processedObject of objects) {
		for (const processedObjectKey in processedObject) {
			const processedObjectValue = processedObject[processedObjectKey];
			newObject[processedObjectKey] = !(processedObjectKey in newObject)
				|| !(typeof processedObjectValue !== null && typeof processedObjectValue === 'object')
				? processedObjectValue
				: mergeObject(newObject[processedObjectKey], processedObjectValue);
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
const bundlesStats = {};

export default function Stylify(): void {
	const { nuxt } = this;
	const nuxtIsInDevMode = typeof nuxt.options.dev === 'boolean' ? nuxt.options.dev : moduleConfig.dev;

	moduleConfig.dev = nuxtIsInDevMode;
	moduleConfig.compiler.mangleSelectors = !moduleConfig.dev;

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

	if (moduleConfig.dev) {
		this.addPlugin({
			ssr: false,
			src: path.resolve(__dirname, 'profiler-plugin.js')
		});
	}

	const compiler = new Compiler(moduleConfig.compiler);

	this.extendBuild((config: Record<string, any>): void => {
		config.module.rules.push({
			test: moduleConfig.loader.test,
			exclude: moduleConfig.loader.exclude,
			use: {
				loader: path.join(__dirname, 'webpack-loader.js'),
				options: {
					compiler: compiler,
					getCompilationResult: (): CompilationResult|null => {
						return compilationResult;
					},
					setCompilationResult: (compilationResultFromBuild: CompilationResult): void => {
						compilationResult = compilationResultFromBuild;
					},
					addBundleStats: (stats: BundleStatsInterface): void => {
						if (stats.resourcePath in bundlesStats) {
							return;
						}
						bundlesStats[stats.resourcePath] = stats;
					}
				}
			}
		});
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
				bundlesStats: Object.values(bundlesStats),
				serializedCompilationResult: JSON.stringify(compilationResult.serialize())
			}
		});

		params.HEAD += `<script class="stylify-profiler-data" type="application/json">${JSON.stringify(data)}</script>`;
	};

	nuxt.hook('vue-renderer:ssr:templateParams', (params: Record<string, any>): void => {
		dumpProfilerInfo(params);
	});
}
