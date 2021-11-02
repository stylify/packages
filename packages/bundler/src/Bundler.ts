import * as fg from 'fast-glob';
import {
	CompilationResult,
	Compiler,
	CompilerConfigInterface,
	CompilerContentOptionsInterface,
	CssRecord
} from '@stylify/stylify';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

interface BundleFileDataInterface {
	filePath: string,
	contentOptions: ContentOptionsInterface,
	content: string
}

interface BundleInterface {
	mangleSelectors?: boolean,
	dumpCache?: boolean,
	cache?: JSON | string,
	outputFile: string,
	scope?: string,
	files: string[]
}

interface ContentOptionsInterface extends CompilerContentOptionsInterface {
	files: string[]
}

interface BundlesBuildCacheInterface {
	compiler: Compiler,
	compilationResult: CompilationResult,
	buildTime: string,
	files: string[]
}

interface BundlesBuildStatsInterface {
	name: string,
	size: number,
	buildTime: string
}

export interface BundlerConfigInterface {
	compilerConfig: CompilerConfigInterface,
	verbose?: boolean,
	watchFiles?: boolean
}

export class Bundler {

	private bundlesBuildCache: Record<string, BundlesBuildCacheInterface> = {};

	private config: BundlerConfigInterface = {
		compilerConfig: null,
		verbose: true,
		watchFiles: false
	}

	public constructor(options: BundlerConfigInterface) {
		this.config = {
			...this.config,
			...options
		};

		if (!('contentOptionsProcessors' in this.config.compilerConfig)) {
			this.config.compilerConfig.contentOptionsProcessors = {};
		}

		this.config.compilerConfig.contentOptionsProcessors.files = (
			contentOptions: ContentOptionsInterface,
			optionMatchValue: string
		): ContentOptionsInterface => {
			const optionMatchValueToArray = optionMatchValue.split(' ').filter((value: string): boolean => {
				return value.trim().length !== 0;
			});

			contentOptions.files = [...contentOptions.files || [], ...optionMatchValueToArray];
			return contentOptions;
		};
	}

	public bundle(bundles: BundleInterface[]): void {
		const startTime = performance.now();

		for (const bundleConfig of bundles) {
			this.processBundle(bundleConfig);
		}

		if (this.config.watchFiles) {
			this.log(`Waching for changes...`, 'textYellow');
		} else if (this.config.verbose) {
			let buildsInfo = [];

			for (const bundleOutputFile in this.bundlesBuildCache) {
				if (!fs.existsSync(bundleOutputFile)) {
					continue;
				}

				const bundleBuildCache = this.bundlesBuildCache[bundleOutputFile];
				buildsInfo.push({
					name: bundleOutputFile,
					size: fs.statSync(bundleOutputFile).size / 1024,
					buildTime: bundleBuildCache.buildTime
				});
			}
			buildsInfo = buildsInfo.sort(
				(nextItem: BundlesBuildStatsInterface, previousItem: BundlesBuildStatsInterface): number => {
					if (nextItem.size > previousItem.size) {
						return -1;
					}

					return 0;
				}
			);

			const tablesData = [];

			for (const buildInfo of buildsInfo) {
				tablesData.push({
					Name: buildInfo.name,
					'Build size (Kb)': buildInfo.size.toFixed(2),
					'Build time (s)': buildInfo.buildTime
				});
			}

			if (tablesData.length) {
				if (this.config.verbose) {
					// eslint-disable-next-line no-console
					console.table(tablesData);
				}
			} else {
				this.log('No bundle was processed.', 'textRed');
			}

			this.log(`Build done (${((performance.now() - startTime)/1000).toFixed(2)} s).`);
		}
	}

	private processBundle(bundleConfig: BundleInterface): void {
		const startTime = performance.now();
		this.log(`Processing ${bundleConfig.outputFile}.`, 'textCyan');

		if (!(bundleConfig.outputFile in this.bundlesBuildCache)) {
			const originalOnPrepareCompilationResultFunction = this.config.compilerConfig.onPrepareCompilationResult;
			const compiler = new Compiler(this.config.compilerConfig);
			compiler.onPrepareCompilationResult = (compilationResult: CompilationResult): void => {
				compilationResult.configure({
					mangleSelectors: bundleConfig.mangleSelectors || false,
					reconfigurable: false
				});

				if (bundleConfig.scope) {
					compilationResult.onPrepareCssRecord = (cssRecord: CssRecord): void => {
						cssRecord.scope = bundleConfig.scope;
					};
				}

				if (typeof originalOnPrepareCompilationResultFunction === 'function') {
					originalOnPrepareCompilationResultFunction(compilationResult);
				}
			};

			let compilationResult = null;
			if (bundleConfig.cache) {
				compilationResult = compiler.createCompilationResultFromSerializedData(
					typeof bundleConfig.cache === 'string' ? JSON.parse(bundleConfig.cache) : bundleConfig.cache
				);
			}

			this.bundlesBuildCache[bundleConfig.outputFile] = {
				compiler: compiler,
				compilationResult: compilationResult,
				buildTime: null,
				files: []
			};
		}

		const bundleBuildCache = this.bundlesBuildCache[bundleConfig.outputFile];
		const compiler = bundleBuildCache.compiler;

		const filesToProcess = this.getFilesToProcess(compiler, bundleConfig.files);

		if (!filesToProcess.length) {
			this.log(`No files found for ${bundleConfig.outputFile}. Skipping.`, 'textRed');
			return;
		}

		for (const fileToProcessConfig of filesToProcess) {
			if (!fs.existsSync(fileToProcessConfig.filePath)) {
				this.log(`File ${fileToProcessConfig.filePath} not found. Skipping`, 'textRed');
				continue;
			}

			if (!(fileToProcessConfig.filePath in bundleBuildCache)) {
				bundleBuildCache.files.push(fileToProcessConfig.filePath);
				if (this.config.watchFiles) {
					fs.watchFile(fileToProcessConfig.filePath, () => {
						this.log(`${fileToProcessConfig.filePath} changed.`, null, 2);
						this.processBundle({
							...bundleConfig,
							...{files: [fileToProcessConfig.filePath]}
						});
						this.log(`Waching for changes...`, 'textYellow');
					});
				}
			}

			if (Object.keys(fileToProcessConfig.contentOptions.components).length) {
				compiler.configure({
					components: fileToProcessConfig.contentOptions.components
				});
			}

			if (fileToProcessConfig.contentOptions.pregenerate) {
				compiler.configure({
					pregenerate: fileToProcessConfig.contentOptions.pregenerate
				});
			}

			bundleBuildCache.compilationResult = compiler.compile(
				fileToProcessConfig.content,
				bundleBuildCache.compilationResult
			);

			if (bundleConfig.mangleSelectors) {
				const processedContent = compiler.rewriteSelectors(
					fileToProcessConfig.content,
					bundleBuildCache.compilationResult
				);
				fs.writeFileSync(fileToProcessConfig.filePath, processedContent);
			}
		}

		const outputDir = path.dirname(bundleConfig.outputFile);

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, {recursive: true});
		}

		fs.writeFileSync(bundleConfig.outputFile, bundleBuildCache.compilationResult.generateCss());

		if (bundleConfig.dumpCache) {
			const serializedResult = bundleBuildCache.compilationResult.serialize();

			for (const selector in serializedResult.selectorsList) {
				delete serializedResult.selectorsList[selector].onAddProperty;
				delete serializedResult.selectorsList[selector].scope;
			}

			delete serializedResult.onPrepareCssRecord;

			fs.writeFileSync(bundleConfig.outputFile + '.json', JSON.stringify(serializedResult));
		}

		bundleBuildCache.buildTime = ((performance.now() - startTime)/1000).toFixed(2);
		this.log(`Created ${bundleConfig.outputFile} (${bundleBuildCache.buildTime} s).`, 'textGreen');
	}

	private getFilesToProcess(compiler: Compiler, filesMasks: string[]): BundleFileDataInterface[] {
		const filePaths = fg.sync(filesMasks);

		let filesToProcess: BundleFileDataInterface[] = [];

		for (const filePath of filePaths) {
			const fileContent = fs.readFileSync(filePath).toString();
			const contentOptionsFromFiles = compiler.getOptionsFromContent(fileContent) as ContentOptionsInterface;
			let filePathsFromContent = contentOptionsFromFiles.files || [];

			if (filePathsFromContent.length) {
				filePathsFromContent = filePathsFromContent.map((fileOptionValue) => {
					return path.join(path.dirname(filePath), fileOptionValue);
				});
			}

			filesToProcess.push({
				filePath: filePath,
				contentOptions: contentOptionsFromFiles,
				content: fileContent
			});

			if (filePathsFromContent.length) {
				filesToProcess = [
					...filesToProcess, ...this.getFilesToProcess(compiler, filePathsFromContent)
				];
			}
		}

		return filesToProcess;
	}

	private log(content: string, colorName: string = null, newLinesCount: number = null): void {
		if (!this.config.verbose) {
			return;
		}

		const colors = {
			reset: '\x1b[0m',
			textWhite: '\x1b[37m',
			textCyan: '\x1b[36m',
			textRed: '\x1b[31m',
			textGreen: '\x1b[32m',
			textYellow: '\x1b[33m'
		};

		if (newLinesCount) {
			while (newLinesCount --) {
				// eslint-disable-next-line no-console
				console.log();
			}
		}

		const logTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

		// eslint-disable-next-line no-console
		console.log(
			colorName ? colors[colorName] : colors.textWhite,
			`[${logTime}] @stylify/bundler: ${content}`,
			colors.reset
		);
	}

}
