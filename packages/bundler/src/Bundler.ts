import * as fg from 'fast-glob';
import {
	CompilationResult,
	Compiler,
	CompilerConfigInterface,
	CompilerContentOptionsInterface,
	CssRecord
} from '@stylify/stylify';
import fs from 'fs';
import { default as normalize } from 'normalize-path';
import path from 'path';
import { performance } from 'perf_hooks';

interface BundleFileDataInterface {
	filePath: string,
	contentOptions: ContentOptionsInterface,
	content: string
}

export interface DumpVariablesIntoFileOptionsInterface {
	filePath: string,
	fileType: string,
	variablePrefix?: string,
	variableValueSeparator?: string,
	afterValue?: string,
	fileContentPrefix?: string,
	fileContentSuffix?: string,
}

export interface BundleConfigInterface {
	id?: string,
	mangleSelectors?: boolean,
	rewriteSelectorsInFiles?: boolean,
	dumpCache?: boolean,
	cache?: JSON | string,
	outputFile: string,
	scope?: string,
	files: string[],
	compiler?: CompilerConfigInterface,
	callback?: (
		bundleConfig: BundleConfigInterface, bundleBuildCache: BundlesBuildCacheInterface
	) => void | Promise<void>
}

export interface ContentOptionsInterface extends CompilerContentOptionsInterface {
	files: string[]
}

export interface BundlesBuildCacheInterface {
	id: string | null
	compiler: Compiler,
	compilationResult: CompilationResult,
	buildTime: string,
	files: string[]
}

export type BundlesBuildCacheType = Record<string, BundlesBuildCacheInterface>;

export interface BundlesBuildStatsInterface {
	name: string,
	size: number,
	buildTime: string
}

export interface BundlerConfigInterface {
	configFile?: string,
	compiler: CompilerConfigInterface,
	verbose?: boolean,
	watchFiles?: boolean,
	sync?: boolean,
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
	bundles?: BundleConfigInterface[]
}

export interface WatchedFilesInterface {
	watcher: fs.FSWatcher,
	processing: boolean,
	bundlesIndexes: string[]
}

export class Bundler {

	private readonly WATCH_FILE_DOUBLE_TRIGGER_BLOCK_TIMEOUT = 500;

	private bundlesBuildCache: BundlesBuildCacheType = {};

	private processedBundlesQueue: Promise<void>[] = [];

	private isReloadingConfiguration = false;

	private watchedFiles: Record<string, WatchedFilesInterface> = {};

	private configurationLoadingPromise: Promise<void> = null;

	private configFile: string = null;

	private configFileWatcherInitialized = false;

	private compilerConfig: CompilerConfigInterface = null;

	private verbose = true;

	private sync = true;

	private watchFiles = false;

	private cssVarsDirPath: string = null;

	private sassVarsDirPath: string = null;

	private lessVarsDirPath: string = null;

	private stylusVarsDirPath: string = null;

	private bundles: Record<string, BundleConfigInterface> = {};

	public constructor(config: BundlerConfigInterface) {
		this.configurationLoadingPromise = this.configure(config);
	}

	private mergeConfigs(config: BundlerConfigInterface) {
		this.configFile = config.configFile || this.configFile;

		this.compilerConfig = {
			...this.compilerConfig,
			...config.compiler || {}
		};

		if ('verbose' in config) {
			this.verbose = config.verbose;
		}

		if ('sync' in config) {
			this.sync = config.sync;
		}

		if ('watchFiles' in config) {
			this.watchFiles = config.watchFiles;
		}

		this.cssVarsDirPath = config.cssVarsDirPath || this.cssVarsDirPath;
		this.sassVarsDirPath = config.sassVarsDirPath || this.sassVarsDirPath;
		this.lessVarsDirPath = config.lessVarsDirPath || this.lessVarsDirPath;
		this.stylusVarsDirPath = config.stylusVarsDirPath || this.stylusVarsDirPath;

		if ('bundles' in config) {
			this.addBundles(config.bundles);
		}
	}

	private async loadFileConfig(): Promise<void> {
		if (![typeof require, typeof require.cache].includes('undefined')) {
			delete require.cache[this.configFile];
		}
		const fileConfig = await import(this.configFile);
		this.mergeConfigs(fileConfig);
	}

	public async configure(config: BundlerConfigInterface): Promise<void> {
		if ('configFile' in config && !this.configFile) {
			this.configFile = config.configFile;

			if (!fs.existsSync(this.configFile)) {
				this.log(`Configuration file "${this.configFile}" not found.`, 'textRed');
				return;
			}

			await this.loadFileConfig();
		}

		this.mergeConfigs(config);

		if (!('contentOptionsProcessors' in this.compilerConfig)) {
			this.compilerConfig.contentOptionsProcessors = {};
		}

		this.compilerConfig.contentOptionsProcessors.files = (
			contentOptions: ContentOptionsInterface,
			optionMatchValue: string
		): ContentOptionsInterface => {
			const optionMatchValueToArray = optionMatchValue.split(' ').filter((value: string): boolean => {
				return value.trim().length !== 0;
			});

			contentOptions.files = [...contentOptions.files || [], ...optionMatchValueToArray];
			return contentOptions;
		};

		if (this.cssVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.cssVarsDirPath,
				fileType: 'css',
				variablePrefix: '--',
				variableValueSeparator: ': ',
				afterValue: ';',
				fileContentPrefix: ':root {\n',
				fileContentSuffix: '\n}'
			});
		}

		if (this.sassVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.sassVarsDirPath,
				fileType: 'scss',
				variablePrefix: '$',
				variableValueSeparator: ': ',
				afterValue: ';'
			});
		}

		if (this.lessVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.lessVarsDirPath,
				fileType: 'less',
				variablePrefix: '@',
				variableValueSeparator: ': '
			});
		}

		if (this.stylusVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.stylusVarsDirPath,
				fileType: 'styl',
				variablePrefix: '',
				variableValueSeparator: ' = '
			});
		}

		this.configurationLoadingPromise = null;
	}

	private dumpVariablesIntoFile(options: DumpVariablesIntoFileOptionsInterface): void {
		let fileVariablesContent = options.fileContentPrefix || '';
		const variablePrefix = options.variablePrefix || '';
		const variableValueSeparator = options.variableValueSeparator || '';
		const afterValue = options.afterValue || '';

		for (const variable in this.compilerConfig.variables) {
			const variableValue = this.compilerConfig.variables[variable];
			fileVariablesContent += `${variablePrefix}${variable}${variableValueSeparator}${variableValue}${afterValue}\n`;
		}

		fileVariablesContent = fileVariablesContent.trim();

		if (!fs.existsSync(options.filePath)) {
			fs.mkdirSync(options.filePath);
		}

		fileVariablesContent += options.fileContentSuffix || '';
		const variablesFilePath = path.join(options.filePath, `stylify-variables.${options.fileType}`);
		fs.writeFileSync(variablesFilePath, fileVariablesContent);

		this.log(`Variables file "${variablesFilePath}" created.`, 'textGreen');
	}

	public async waitOnBundlesProcessed(): Promise<void> {
		if (this.processedBundlesQueue.length) {
			await Promise.all(this.processedBundlesQueue);
		}
	}

	public findBundleCache(id: string): BundlesBuildCacheInterface | null {
		return Object.values(this.bundlesBuildCache).find((value): boolean => value.id === id) || null;
	}

	private addBundles(bundles: BundleConfigInterface[]) {
		for (const bundle of bundles) {
			const bundleToProcess = {
				...bundle.outputFile in this.bundles ? this.bundles[bundle.outputFile] : {},
				...bundle,
				...{
					rewriteSelectorsInFiles: 'rewriteSelectorsInFiles' in bundle
						? bundle.rewriteSelectorsInFiles
						: bundle.mangleSelectors
				}
			};
			this.bundles[bundle.outputFile] = bundleToProcess;
		}
	}

	public async bundle(bundles: BundleConfigInterface[] = null): Promise<void> {
		if (this.configurationLoadingPromise instanceof Promise) {
			await this.configurationLoadingPromise;
		}

		if (this.watchFiles && !this.configFileWatcherInitialized) {
			this.configFileWatcherInitialized = true;
			this.log(`Watching config file "${this.configFile}" for changes...`, 'textYellow');

			fs.watch(this.configFile, () => {
				if (this.isReloadingConfiguration) {
					return;
				}
				this.configurationLoadingPromise = new Promise((resolveConfigurationLoading) => {
					this.isReloadingConfiguration = true;
					this.bundlesBuildCache = {};
					this.processedBundlesQueue = [];

					for (const watchedFile in this.watchedFiles) {
						this.watchedFiles[watchedFile].watcher.close();
					}

					this.watchedFiles = {};

					this.loadFileConfig().finally(() => {
						setTimeout(() => {
							resolveConfigurationLoading();
							this.configurationLoadingPromise = null;
							this.log('Configuration reloaded.', 'textGreen', null, 2);
							this.bundle().finally(() => {
								this.isReloadingConfiguration = false;
							});
						}, this.WATCH_FILE_DOUBLE_TRIGGER_BLOCK_TIMEOUT);
					});
				});
			});
		}

		if (bundles) {
			this.addBundles(bundles);
		}

		const startTime = performance.now();

		for (const bundleConfig of Object.values(this.bundles)) {
			this.processBundle(bundleConfig);
		}

		if (this.sync) {
			await Promise.all(this.processedBundlesQueue);
			this.processedBundlesQueue = [];
		}

		if (this.watchFiles) {
			this.log(`Waching for changes...`, 'textYellow');

		} else if (this.verbose) {
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
					'Build size (KB)': buildInfo.size.toFixed(2),
					'Build time (s)': buildInfo.buildTime
				});
			}

			if (tablesData.length) {
				if (this.verbose) {
					// eslint-disable-next-line no-console
					console.table(tablesData);
				}
			} else {
				this.log('No bundle was processed.', 'textRed');
			}

			this.log(`Build done (${((performance.now() - startTime)/1000).toFixed(2)} s).`);
		}
	}

	private processBundle(bundleConfig: BundleConfigInterface): void {
		this.processedBundlesQueue.push(new Promise((resolve): void => {
			if (!('files' in bundleConfig)) {
				this.log(`No files defined for "${bundleConfig.outputFile}". Skipping.`, 'textRed');
				return;
			}

			const startTime = performance.now();
			this.log(`Processing "${bundleConfig.outputFile}".`, 'textCyan');

			if (!Array.isArray(bundleConfig.files)) {
				bundleConfig.files = [bundleConfig.files];
			}

			if (!(bundleConfig.outputFile in this.bundlesBuildCache)) {
				const bundleCompilerConfig = {
					...this.compilerConfig,
					...bundleConfig.compiler || {}
				};
				const originalOnPrepareCompilationResultFunction = bundleCompilerConfig.onPrepareCompilationResult;

				const compiler = new Compiler(bundleCompilerConfig);
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
					id: bundleConfig.id || null,
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
				this.log(`No files found for "${bundleConfig.outputFile}". Skipping.`, 'textRed');
				return;
			}

			for (const fileToProcessConfig of filesToProcess) {
				const fileToProcessPath = fileToProcessConfig.filePath;
				if (!fs.existsSync(fileToProcessPath)) {
					this.log(`File "${fileToProcessPath}" not found. Skipping`, 'textRed');
					continue;
				}

				if (!(fileToProcessPath in bundleBuildCache)) {
					bundleBuildCache.files.push(fileToProcessPath);
					if (this.watchFiles) {
						const isFileInWatchedFiles = fileToProcessPath in this.watchedFiles;
						if (isFileInWatchedFiles
							&& !this.watchedFiles[fileToProcessPath].bundlesIndexes.includes(bundleConfig.outputFile)
						) {
							this.watchedFiles[fileToProcessPath].bundlesIndexes.push(bundleConfig.outputFile);

						} else if (!isFileInWatchedFiles) {
							this.watchedFiles[fileToProcessPath] = {
								bundlesIndexes: [bundleConfig.outputFile],
								processing: false,
								watcher: fs.watch(fileToProcessPath, () => {
									if (this.watchedFiles[fileToProcessPath].processing) {
										return;
									}

									this.watchedFiles[fileToProcessPath].processing = true;
									this.log(`"${fileToProcessPath}" changed.`, null, 2);
									const bundlesIndexes = this.watchedFiles[fileToProcessPath].bundlesIndexes;

									for (const bundleToProcessIndex of bundlesIndexes) {
										this.processBundle({
											...this.bundles[bundleToProcessIndex],
											...{files: [fileToProcessPath]}
										});
									}

									this.waitOnBundlesProcessed().finally(() => {
										setTimeout(() => {
											this.watchedFiles[fileToProcessPath].processing = false;
											this.log(`Watching for changes...`, 'textYellow');
										}, this.WATCH_FILE_DOUBLE_TRIGGER_BLOCK_TIMEOUT);
									});
								})
							};
						}
					}
				}

				compiler.configure(fileToProcessConfig.contentOptions);

				bundleBuildCache.compilationResult = compiler.compile(
					fileToProcessConfig.content,
					bundleBuildCache.compilationResult
				);

				if (bundleConfig.rewriteSelectorsInFiles) {
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
			this.log(`Created "${bundleConfig.outputFile}" (${bundleBuildCache.buildTime} s).`, 'textGreen');
			const callbackPossiblePromise = bundleConfig.callback
				? bundleConfig.callback(bundleConfig, bundleBuildCache)
				: null;

			if (callbackPossiblePromise instanceof Promise) {
				callbackPossiblePromise.finally(() => {
					resolve();
				});
			} else {
				resolve();
			}
		}));
	}

	private getFilesToProcess(compiler: Compiler, filesMasks: string[]): BundleFileDataInterface[] {
		filesMasks = filesMasks.map((fileMask: string): string => {
			return normalize(fileMask) as string;
		});

		const filePaths = fg.sync(filesMasks);

		let filesToProcess: BundleFileDataInterface[] = [];

		for (const filePath of filePaths) {
			const fileContent = fs.readFileSync(filePath).toString();
			const contentOptionsFromFiles = compiler.getOptionsFromContent(fileContent) as ContentOptionsInterface;
			let filePathsFromContent = contentOptionsFromFiles.files || [];

			if (filePathsFromContent.length) {
				filePathsFromContent = filePathsFromContent.map((fileOptionValue) => {
					return fileOptionValue.startsWith(path.sep)
						? fileOptionValue
						: path.join(path.dirname(filePath), fileOptionValue);
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

	private log(
		content: string,
		colorName: string = null,
		newLinesBeforeCount: number = null,
		newLinesAfterCount: number = null
	): void {
		if (!this.verbose) {
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

		const logEmptyLines = (count) => {
			while (count --) {
				// eslint-disable-next-line no-console
				console.log();
			}
		};

		if (newLinesBeforeCount) {
			logEmptyLines(newLinesBeforeCount);
		}

		const logTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

		// eslint-disable-next-line no-console
		console.log(
			colorName ? colors[colorName] : colors.reset,
			`[${logTime}] @stylify/bundler: ${content}`,
			colors.reset
		);

		if (newLinesAfterCount) {
			logEmptyLines(newLinesAfterCount);
		}
	}

}
