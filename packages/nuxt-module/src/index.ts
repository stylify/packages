import fs from 'fs';
import path from 'path';
import {
	Compiler,
	SelectorsRewriter,
	HooksManager,
	nativePreset,
	CompilationResult,
	StylifyConfigInterface
} from '@stylify/stylify';
import type { PrefixesMapRecordType } from '@stylify/autoprefixer';
import Prefixer from '@stylify/autoprefixer/esm/Prefixer';
const configFileName = 'stylify.config.js';
const serializedCompilationResultPreflightFileName = 'stylify-preflight.json';
let serializedCompilationResultPreflightFilePath: string = null;
const serializedPrefixesMapFileName = 'stylify-prefixes.json';
let serializedPrefixesMapFilePath = null;

export interface StylifyNuxtModuleConfigInterface extends StylifyConfigInterface {
	configPath: string,
	cache: {
		enabled: boolean,
		recordsLimit: number
	},
	generateCssPerPage: boolean,
	embeddedCssLimit: number,
	importStylify: boolean,
	importProfiler: boolean,
	prefixesMap: Partial<PrefixesMapRecordType>,
}

let moduleConfig: StylifyNuxtModuleConfigInterface = {
	configPath: configFileName,
	cache: {
		enabled: true,
		recordsLimit: 100
	},
	generateCssPerPage: true,
	embeddedCssLimit: 50,
	importStylify: true,
	importProfiler: true,
	compiler: nativePreset.compiler,
	runtime: {},
	prefixesMap: {}
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
	moduleConfig = mergeObject(moduleConfig, config);
};

const convertObjectToStringableForm = (processedObject: Record<string, any>): Record<string, any> => {
	const newObject = {};

	for (const key in processedObject) {
		const processedValue = processedObject[key];

		if (processedValue !== null
			&& processedValue !== true
			&& processedValue !== false
			&& typeof processedValue === 'object'
		) {
			newObject[key] = convertObjectToStringableForm(processedValue);
		} else if (typeof processedValue === 'function') {
			newObject[key] = `FN__${processedValue.toString() as string}`;
		} else {
			newObject[key] = processedValue;
		}
	}

	return newObject;
};

const compilationResultCacheExists = (): boolean => {
	return fs.existsSync(serializedCompilationResultPreflightFilePath);
};

let loadedCompilationResultCache: Record<string, any> = null;
const loadCompilationResultCache = (): Record<string, any> => {
	if (!compilationResultCacheExists()) {
		saveCompilationResultCache({});
		return {};
	}

	return JSON.parse(fs.readFileSync(serializedCompilationResultPreflightFilePath).toString()) as Record<string, any>;
};

const saveCompilationResultCache = (data: Record<string, any>): void => {
	fs.writeFileSync(serializedCompilationResultPreflightFilePath, JSON.stringify(data, null, 4));
};

let prefixerConfigured = false;
const prefixesMapExists = (): boolean => {
	return fs.existsSync(serializedPrefixesMapFilePath);
};
const loadPrefixesMap = (): Record<string, any> => {
	if (!prefixesMapExists()) {
		savePrefixesMap({});
		return {};
	}

	return JSON.parse(fs.readFileSync(serializedPrefixesMapFilePath).toString()) as Record<string, any>;
};

const savePrefixesMap = (data: Record<string, any>): void => {
	fs.writeFileSync(
		serializedPrefixesMapFilePath,
		JSON.stringify(data, null, 4)
	);
};

let prefixesMap = {};
const mergePrefixesMap = (data: Record<string, any>) => {
	prefixesMap = {...prefixesMap, ...data};
};

let preflightCompilationResult: CompilationResult = null;

const setPreflightCompilationResult = (compilationResult: CompilationResult): void => {
	preflightCompilationResult = compilationResult;
};

const getPreflightCompilationResult = (): CompilationResult => {
	return preflightCompilationResult;
};

export default function Stylify(): void {
	const { nuxt } = this;
	const nuxtIsInDevMode = typeof nuxt.options.dev === 'boolean' ? nuxt.options.dev : false;
	const nuxtBuildDir = nuxt.options.buildDir;
	serializedCompilationResultPreflightFilePath = path.join(
		nuxtBuildDir, serializedCompilationResultPreflightFileName
	);
	serializedPrefixesMapFilePath = path.join(nuxtBuildDir, serializedPrefixesMapFileName);

	moduleConfig.compiler.selectorsAttributes = ['v-bind:class', ':class'];
	moduleConfig.compiler.dev = nuxtIsInDevMode;
	moduleConfig.compiler.mangleSelectors = !nuxtIsInDevMode;
	moduleConfig.importProfiler = nuxtIsInDevMode;

	mergeConfig(nuxt.options.stylify);

	const configPath = nuxt.resolver.resolveAlias(moduleConfig.configPath);

	if (fs.existsSync(configPath)) {
		mergeConfig(nuxt.resolver.requireModule(configPath));

		if (nuxtIsInDevMode) {
			nuxt.options.watch.push(configPath);
		}
	}

	const compiler = new Compiler(moduleConfig.compiler);
	const prefixer = new Prefixer(HooksManager);
	const cache = {};

	const processTemplateParams = (params, context = null): void => {
		const url = context ? context.nuxt.routePath : null;
		const isUrlCached = context ? url in cache : false;
		let compilationResult: CompilationResult;
		let metaTags;

		if (context && !nuxtIsInDevMode && isUrlCached) {
			compilationResult = cache[url].compilationResult;
			metaTags = cache[url].metaTags;

		} else {
			let preparedCompilationResult = null;

			if (compilationResultCacheExists()) {
				loadedCompilationResultCache = loadCompilationResultCache();
				preparedCompilationResult = compiler.createResultFromSerializedData({
					selectorsList: loadedCompilationResultCache.selectorsList,
					mangledSelectorsMap: loadedCompilationResultCache.mangledSelectorsMap
				});
			}

			if (prefixesMapExists() && !prefixerConfigured) {
				prefixerConfigured = true;
				prefixer.setPrefixesMap(loadPrefixesMap());
			}

			compilationResult = compiler.compile(params.APP, preparedCompilationResult);
			const css: string = compilationResult.generateCss();
			const serializedCompilatiResultHtml = `
				<script class="stylify-runtime-cache" type="application/json">
					${JSON.stringify(compilationResult.serialize())}
				</script>
			`;
			metaTags = `
				${moduleConfig.importStylify ? serializedCompilatiResultHtml : ''}
				<style id="stylify-css">${css}</style>
			`;

			if (context) {
				cache[url] = {
					compilationResult: compilationResult,
					metaTags: metaTags
				};
			}
		}

		params.HEAD += metaTags;
		params.APP = moduleConfig.compiler.mangleSelectors
			? SelectorsRewriter.rewrite(compilationResult, compiler.selectorAttributes, params.APP)
			: params.APP;
	};

	if (moduleConfig.importStylify) {
		moduleConfig.importProfiler = moduleConfig.importProfiler && !moduleConfig.compiler.mangleSelectors;
		this.addPlugin({
			ssr: false,
			src: path.resolve(__dirname, 'stylify-plugin.js'),
			options: convertObjectToStringableForm(moduleConfig)
		});

		if (moduleConfig.importProfiler) {
			this.addPlugin({
				ssr: false,
				src: path.resolve(__dirname, 'profiler-plugin.js')
			});
		}
	}

	this.extendBuild((config: Record<string, any>): void => {
		config.module.rules.push({
			enforce: 'pre',
			test: /\.vue$/i,
			exclude: /node_modules/,
			use: {
				loader: path.join(__dirname, 'webpack-loader.js'),
				options: {
					setPreflightCompilationResult: setPreflightCompilationResult,
					getPreflightCompilationResult: getPreflightCompilationResult,
					mergePrefixesMap: mergePrefixesMap,
					compiler: compiler
				}
			}
		});
	});

	nuxt.hook('build:done', (): void => {
		const serializedPreflightCompilationResult = getPreflightCompilationResult().serialize();
		const newSelectorsList = {};

		for (const selector in serializedPreflightCompilationResult.selectorsList) {
			const data = serializedPreflightCompilationResult.selectorsList[selector];
			data.processed = false;
			newSelectorsList[selector] = data;
		}

		serializedPreflightCompilationResult.selectorsList = newSelectorsList;

		if (moduleConfig.generateCssPerPage) {
			serializedPreflightCompilationResult.cssTree = {};
		}

		savePrefixesMap(prefixesMap);
		saveCompilationResultCache(serializedPreflightCompilationResult);
	});

	nuxt.hook('vue-renderer:spa:templateParams', (params: Record<string, any>): void => {
		processTemplateParams(params);
	});

	nuxt.hook('vue-renderer:ssr:templateParams', (params: Record<string, any>, context: Record<string, any>): void => {
		processTemplateParams(params, context);
	});

}
