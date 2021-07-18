import fs from 'fs';
import path from 'path';
import { Compiler, SelectorsRewriter, nativeConfig as compilerConfig } from '@stylify/stylify';

const CONFIG_FILE_NAME = 'stylify.config.js';
const serializedCompilationResultPreflightFileName = 'stylify-preflight-cache.json';
let serializedCompilationResultPreflightFilePath = null;

let moduleConfig = {
	configPath: CONFIG_FILE_NAME,
	cache: {
		enabled: true,
		recordsLimit: 100
	},
	generateCssPerPage: true,
	embeddedCssLimit: 50,
	importStylify: true,
	importProfiler: true,
	compiler: compilerConfig,
	runtime: {}
};

const mergeObject = (...objects) => {
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
}

const mergeConfig = (config) => {
	moduleConfig = mergeObject(moduleConfig, config);
}

const convertObjectToStringableForm = (processedObject) => {
	const newObject = {}

	for (let key in processedObject) {
		const processedValue = processedObject[key];

		if (processedValue !== null
			&& processedValue !== true
			&& processedValue !== false
			&& typeof processedValue === 'object'
		) {
			newObject[key] = convertObjectToStringableForm(processedValue);
		} else if (typeof processedValue === 'function') {
			newObject[key] = 'FN__' + processedValue.toString();
		} else {
			newObject[key] = processedValue;
		}
	}

	return newObject;
}

const compilationResultCacheExists = () => {
	return fs.existsSync(serializedCompilationResultPreflightFilePath);
}

const loadCompilationResultCache = () => {
	if (!compilationResultCacheExists()) {
		saveCompilationResultCache({});
		return {};
	}

	return JSON.parse(fs.readFileSync(serializedCompilationResultPreflightFilePath));
};

const saveCompilationResultCache = (data) => {
	fs.writeFileSync(serializedCompilationResultPreflightFilePath, JSON.stringify(data, null, 4));
}

export default function Stylify() {
	const { nuxt } = this
	const nuxtIsInDevMode =  typeof nuxt.options.dev === "boolean" ? nuxt.options.dev : false;
	const nuxtBuildDir = nuxt.options.buildDir;
	serializedCompilationResultPreflightFilePath = path.join(
		nuxtBuildDir, serializedCompilationResultPreflightFileName
	);

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
	const cache = {};

	const processTemplateParams = (params, context = null) => {
		const url = context ? context.nuxt.routePath : null;
		const isUrlCached = context ? url in cache : false;
		let compilationResult;
		let metaTags;

		if (context && !nuxtIsInDevMode && isUrlCached) {
			compilationResult = cache[url].compilationResult;
			metaTags = cache[url].metaTags;

		} else {
			let preparedCompilationResult = null;

			if (compilationResultCacheExists()) {
				const cache = loadCompilationResultCache();
				preparedCompilationResult = compiler.createResultFromSerializedData({
					selectorsList: cache.selectorsList,
					mangledSelectorsMap: cache.mangledSelectorsMap
				});
			}

			compilationResult = compiler.compile(params.APP, preparedCompilationResult);
			const serializedCompilatiResultHtml = `
				<script class="stylify-runtime-cache" type="application/json">
					${JSON.stringify(compilationResult.serialize())}
				</script>
			`;
			metaTags = `
				${moduleConfig.importStylify ? serializedCompilatiResultHtml : ''}
				<style id="stylify-css">${compilationResult.generateCss()}</style>
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
			? SelectorsRewriter.rewrite(compilationResult, compiler.classMatchRegExp, params.APP)
			: params.APP;
	};

	if (moduleConfig.importStylify) {
		this.addPlugin({
			ssr: false,
			src: path.resolve(__dirname, 'plugin.js'),
			options: convertObjectToStringableForm(moduleConfig)
		});
	}

	this.extendBuild((config) => {
		config.module.rules.push({
			enforce: 'pre',
			test: /\.vue$/i,
			exclude: /node_modules/,
			use: {
				loader: path.join(__dirname, 'webpack-loader.js'),
				options: {
					loadCompilationResultCache: loadCompilationResultCache,
					saveCompilationResultCache: saveCompilationResultCache,
					Compiler: compiler,
				}
			}
		});
	})

	nuxt.hook('build:done', async () => {
		const cache = loadCompilationResultCache();
		const newSelectorsList = {};

		for (const selector in cache.selectorsList) {
			const data = cache.selectorsList[selector];
			data.processed = false;
			newSelectorsList[selector] = data;
		}

		cache.selectorsList = newSelectorsList;
		
		if (moduleConfig.generateCssPerPage) {
			cache.cssTree = {};
		}

		saveCompilationResultCache(cache);
	});

	nuxt.hook('vue-renderer:spa:templateParams', (params) => {
		processTemplateParams(params);
	});

	nuxt.hook('vue-renderer:ssr:templateParams', (params, context) => {
		processTemplateParams(params, context);
	});

}
