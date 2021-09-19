import fs from 'fs';
import path from 'path';
import {
	Compiler,
	SelectorsRewriter,
	HooksManager,
	nativePreset,
	CompilationResult,
	StylifyConfigInterface,
	SerializedCompilationResultInterface
} from '@stylify/stylify';
import type { PrefixesMapRecordType } from '@stylify/autoprefixer';
import Prefixer from '@stylify/autoprefixer/esm/Prefixer';

const configFileName = 'stylify.config.js';
const stylifyCacheFileName = 'stylify-cache.json';
let stylifyCacheFilePath: string = null;

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

interface StylifyCacheFileInterface {
	compilationResult: Partial<SerializedCompilationResultInterface>,
	prefixesMap: Partial<PrefixesMapRecordType>
}

let moduleConfig: StylifyNuxtModuleConfigInterface = {
	dev: false,
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
	if ('extend' in config) {
		moduleConfig = mergeObject(moduleConfig, config.extend);
		delete config.extend;
	}

	moduleConfig = {...moduleConfig, ...config};
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

const stylifyCacheExists = (): boolean => {
	return fs.existsSync(stylifyCacheFilePath);
};

let loadedStylifyCache: StylifyCacheFileInterface = null;
const loadStylifyCache = (): Partial<StylifyCacheFileInterface> => {
	if (moduleConfig.dev || !loadedStylifyCache) {
		loadedStylifyCache = stylifyCacheExists()
			? JSON.parse(fs.readFileSync(stylifyCacheFilePath).toString())
			: saveStylifyCache({});
	}

	return loadedStylifyCache;
};

const saveStylifyCache = (cache: Partial<StylifyCacheFileInterface>): Partial<StylifyCacheFileInterface> => {
	let cacheToSave: Partial<StylifyCacheFileInterface> = stylifyCacheExists()
		? loadStylifyCache()
		: {
			compilationResult: {},
			prefixesMap: {}
		};

	cacheToSave = mergeObject(cacheToSave, cache);
	fs.writeFileSync(
		stylifyCacheFilePath,
		JSON.stringify(mergeObject(cacheToSave, cache), null, 4)
	);

	return cacheToSave;
};

let prefixesMap = {};
const mergePrefixesMap = (data: Record<string, any>): void => {
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
	const nuxtIsInDevMode = typeof nuxt.options.dev === 'boolean' ? nuxt.options.dev : moduleConfig.dev;
	const nuxtBuildDir = nuxt.options.buildDir;
	stylifyCacheFilePath = path.join(nuxtBuildDir, stylifyCacheFileName);

	moduleConfig.dev = nuxtIsInDevMode;
	moduleConfig.compiler.selectorsAttributes = ['v-bind:class', ':class'];
	moduleConfig.compiler.dev = moduleConfig.dev;
	moduleConfig.compiler.mangleSelectors = !nuxtIsInDevMode;
	moduleConfig.runtime.dev = moduleConfig.dev;
	moduleConfig.importProfiler = nuxtIsInDevMode;

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

	const compiler = new Compiler(moduleConfig.compiler);
	const prefixer = new Prefixer(HooksManager);
	const routesCache = {};
	const preflightCache = loadStylifyCache();
	let preparedCompilationResult = null;

	if (preflightCache) {
		preparedCompilationResult = compiler.createResultFromSerializedData({
			selectorsList: preflightCache.compilationResult.selectorsList,
			mangledSelectorsMap: preflightCache.compilationResult.mangledSelectorsMap
		});

		prefixer.setPrefixesMap(preflightCache.prefixesMap);
	}

	const processTemplateParams = (params: Record<string, any>, context = null): void => {
		const url = context ? context.nuxt.routePath : null;
		const isUrlCached = context ? url in routesCache : false;
		let compilationResult: CompilationResult;
		let metaTags: string;

		if (context && !nuxtIsInDevMode && isUrlCached) {
			compilationResult = routesCache[url].compilationResult;
			metaTags = routesCache[url].metaTags;

		} else {
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
				routesCache[url] = {
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

		saveStylifyCache({
			compilationResult: serializedPreflightCompilationResult,
			prefixesMap: prefixesMap
		});
	});

	nuxt.hook('vue-renderer:spa:templateParams', (params: Record<string, any>): void => {
		processTemplateParams(params);
	});

	nuxt.hook('vue-renderer:ssr:templateParams', (params: Record<string, any>, context: Record<string, any>): void => {
		processTemplateParams(params, context);
	});

}
