import {
	CompilationResult,
	Compiler,
	RuntimeConfigInterface,
	SerializedCompilationResultInterface,
	nativePreset
} from '@stylify/stylify';
import type { CssRecord } from '@stylify/stylify';
import { Prefixer } from '@stylify/autoprefixer/esm/prefixer';
import type { PrefixesMapRecordType } from '@stylify/autoprefixer';
import fs from 'fs';
import path from 'path';

const configFileName = 'stylify.config.js';
const stylifyCacheFileName = 'stylify-cache.json';
let stylifyCacheFilePath: string = null;

export interface StylifyNuxtModuleConfigInterface extends RuntimeConfigInterface {
	dev: boolean,
	configPath: string,
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
	return fs.existsSync(stylifyCacheFilePath) === true;
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

	if (!stylifyCacheExists()) {
		fs.mkdirSync(path.dirname(stylifyCacheFilePath), {recursive: true});
	}

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
	moduleConfig.compiler.dev = moduleConfig.dev;
	moduleConfig.compiler.mangleSelectors = !moduleConfig.dev;
	moduleConfig.importProfiler = moduleConfig.dev;

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
	const prefixer = new Prefixer();
	const routesCache = {};
	const preflightCache = loadStylifyCache();
	let preparedCompilationResult: CompilationResult = null;

	if (preflightCache) {
		preparedCompilationResult = compiler.createCompilationResultFromSerializedData({
			selectorsList: preflightCache.compilationResult.selectorsList
		});

		prefixer.setPrefixesMap(preflightCache.prefixesMap);
	} else {
		preparedCompilationResult = new CompilationResult();
	}

	preparedCompilationResult.onPrepareCssRecord = (cssRecord: CssRecord): void => {
		cssRecord.onAddProperty = (
			propertyName: string,
			propertyValue: string
		): Record<string, any> => {
			return prefixer.prefix(propertyName, propertyValue) as Record<string, any>;
		};
	};

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
			? compiler.rewriteSelectors(compilationResult, params.APP)
			: params.APP;
	};

	if (moduleConfig.importStylify) {
		this.addPlugin({
			ssr: false,
			src: path.resolve(__dirname, 'runtime-plugin.js'),
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
		saveStylifyCache({
			compilationResult: getPreflightCompilationResult().serialize(),
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
