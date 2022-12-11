import FastGlob from 'fast-glob';
import micromatch from 'micromatch';
import {
	CompilerConfigInterface,
	CompilerContentOptionsInterface,
	createUId,
	DefaultHooksListInterface
} from '@stylify/stylify';
import {
	mergeObjects,
	CompilationResult,
	Compiler,
	Hooks
} from '@stylify/stylify';
import fs from 'fs';
import { default as normalize } from 'normalize-path';
import path from 'path';
import { performance } from 'perf_hooks';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

export interface BundleFileDataInterface {
	filePath: string,
	content: string
}

export interface BundlerHooksListInterface extends DefaultHooksListInterface {
	'bundler:beforeInputFileRewritten': {
		bundleConfig: BundleConfigInterface,
		content: string
		filePath: string
	},
	'bundler:beforeCssFileCreated': {
		content: string,
		bundleConfig: BundleConfigInterface
	},
	'bundler:bundleProcessed': {
		bundleConfig: BundleConfigInterface,
		bundleBuildCache: BundlesBuildCacheInterface
	},
	'bundler:fileToProcessOpened': {
		bundleConfig: BundleConfigInterface,
		filePath: string,
		contentOptions: ContentOptionsInterface,
		isRoot: boolean,
		content: string
	},
	'bundler:initialized': {
		bundler: Bundler
	}
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

export interface BundleConfigInterface {
	id?: string,
	rewriteSelectorsInFiles?: boolean,
	filesBaseDir?: string,
	outputFile: string,
	scope?: string,
	files: string[],
	compiler?: CompilerConfigInterface,
	cssLayer?: string,
}

export interface CSSLayersOrderInterface {
	order: string,
	exportLayer?: string[],
	exportFile?: string
}

export interface BundlerConfigInterface {
	id?: string,
	dev?: boolean,
	configFile?: string,
	autoprefixerEnabled?: boolean,
	compiler?: CompilerConfigInterface,
	filesBaseDir?: string,
	verbose?: boolean,
	watchFiles?: boolean,
	sync?: boolean,
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
	bundles?: BundleConfigInterface[],
	cssLayersOrder?: CSSLayersOrderInterface
}

export interface WatchedFilesInterface {
	watcher: fs.FSWatcher,
	processing: boolean,
	bundlesIndexes: string[]
}

export interface GetFilesToProcessOptionsInterface {
	bundleConfig: BundleConfigInterface,
	compiler: Compiler,
	fileMasks: string[]
	isRoot: boolean
}

const postCssPrefixer = postcss([autoprefixer()]);

export type BundlerHooksNamesListType = keyof BundlerHooksListInterface;

export const hooks = new Hooks<BundlerHooksListInterface>;

export const defineConfig = (config: BundlerConfigInterface): BundlerConfigInterface => config;

export class Bundler {

	private readonly WATCH_FILE_DOUBLE_TRIGGER_BLOCK_TIMEOUT = 500;

	public id: string = createUId();

	private processedBundlesQueue: Promise<void>[] = [];

	private bundleMethodPromise: Promise<void> = null;

	private isReloadingConfiguration = false;

	private watchedFiles: Record<string, WatchedFilesInterface> = {};

	private configurationLoadingPromise: Promise<void> = null;

	private configFile: string = null;

	private configFileWatcherInitialized = false;

	private dev = false;

	private filesBaseDir: string = null;

	private verbose = false;

	private sync = true;

	private watchFiles = false;

	private cssVarsDirPath: string = null;

	private sassVarsDirPath: string = null;

	private lessVarsDirPath: string = null;

	private stylusVarsDirPath: string = null;

	private bundles: Record<string, BundleConfigInterface> = {};

	private autoprefixerEnabled = true;

	private createdFilesContentCache: Record<string, string> = {};

	private cssLayersOrder: CSSLayersOrderInterface = null;

	/**
	 * @internal
	 */
	public compilerConfig: CompilerConfigInterface = {};

	public bundlesBuildCache: BundlesBuildCacheType = {};

	public constructor(config: BundlerConfigInterface) {
		this.configurationLoadingPromise = this.configure(config);
		this.configurationLoadingPromise.finally(() => {
			hooks.callHook('bundler:initialized', {bundler: this});
		});
	}

	private mergeConfigs(config: Partial<BundlerConfigInterface>) {
		this.configFile = config.configFile ?? this.configFile;
		this.dev = config.dev ?? this.dev;
		this.compilerConfig.dev = this.dev;
		this.compilerConfig = mergeObjects(this.compilerConfig, config.compiler ?? {});
		this.verbose = config.verbose ?? this.verbose;
		this.sync = config.sync ?? this.sync;
		this.watchFiles = config.watchFiles ?? this.watchFiles;
		this.filesBaseDir = config.filesBaseDir ?? this.filesBaseDir;
		this.autoprefixerEnabled = config.autoprefixerEnabled ?? this.autoprefixerEnabled;
		this.cssLayersOrder = config.cssLayersOrder ?? this.cssLayersOrder;

		this.cssVarsDirPath = config.cssVarsDirPath ?? this.cssVarsDirPath;
		this.sassVarsDirPath = config.sassVarsDirPath ?? this.sassVarsDirPath;
		this.lessVarsDirPath = config.lessVarsDirPath ?? this.lessVarsDirPath;
		this.stylusVarsDirPath = config.stylusVarsDirPath ?? this.stylusVarsDirPath;

		if ('bundles' in config) {
			this.addBundles(config.bundles);
		}
	}

	private async loadFileConfig(): Promise<void> {
		if (![typeof require, typeof require.cache].includes('undefined')) {
			delete require.cache[this.configFile];
		}
		const fileConfig: Partial<BundlerConfigInterface> = await import(this.configFile);
		this.mergeConfigs(fileConfig);
	}

	public async configure(config: BundlerConfigInterface): Promise<void> {
		this.id = config.id ?? this.id;

		if ('configFile' in config && !this.configFile) {
			this.configFile = config.configFile;

			if (!fs.existsSync(this.configFile)) {
				this.log(`Configuration file "${this.configFile}" not found.`, 'textRed');
				return;
			}

			await this.loadFileConfig();
		}

		this.mergeConfigs(config);

		if (this.compilerConfig.variables) {
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
		}

		if (this.cssLayersOrder && typeof this.cssLayersOrder.exportFile !== 'undefined') {
			this.dumpCssLayersOrderIntoFile();
		}

		this.configurationLoadingPromise = null;
	}

	private dumpCssLayersOrderIntoFile() {
		this.writeFile(this.cssLayersOrder.exportFile, `@layer ${this.cssLayersOrder.order};`);
	}

	private dumpVariablesIntoFile(options: DumpVariablesIntoFileOptionsInterface): void {
		let fileVariablesContent = options.fileContentPrefix || '';
		const variablePrefix = options.variablePrefix || '';
		const variableValueSeparator = options.variableValueSeparator || '';
		const afterValue = options.afterValue || '';

		for (const [variable, variableValue] of Object.entries(this.compilerConfig.variables)) {
			fileVariablesContent += `${variablePrefix}${variable}${variableValueSeparator}${variableValue as string}${afterValue}\n`;
		}

		fileVariablesContent = fileVariablesContent.trim();

		if (!fs.existsSync(options.filePath)) {
			fs.mkdirSync(options.filePath, { recursive: true });
		}

		fileVariablesContent += options.fileContentSuffix || '';
		const variablesFilePath = path.join(options.filePath, `stylify-variables.${options.fileType}`);
		this.writeFile(variablesFilePath, fileVariablesContent);

		this.log(`Variables file "${variablesFilePath}" created.`, 'textGreen');
	}

	public async waitOnBundlesProcessed(): Promise<void> {
		await Promise.all([
			...this.bundleMethodPromise === null ? [] : [this.bundleMethodPromise],
			...this.processedBundlesQueue.length ? this.processedBundlesQueue : []
		]);
	}

	public findBundleCache(id: string): BundlesBuildCacheInterface | null {
		return Object.values(this.bundlesBuildCache).find((value): boolean => value.id === id) || null;
	}

	private addBundles(bundles: BundleConfigInterface[]) {
		for (const bundle of bundles) {
			const mangleSelectors = bundle?.compiler?.mangleSelectors ?? this.compilerConfig.mangleSelectors;
			const bundleToProcess = {
				...bundle.outputFile in this.bundles ? this.bundles[bundle.outputFile] : {},
				...bundle,
				...{
					rewriteSelectorsInFiles: bundle.rewriteSelectorsInFiles ?? mangleSelectors,
					filesBaseDir: bundle.filesBaseDir ?? this.filesBaseDir
				}
			};
			this.bundles[bundle.outputFile] = bundleToProcess;
		}
	}

	public async bundle(bundles: BundleConfigInterface[] = null): Promise<void> {
		let bundleMethodPromiseResolve = null;

		this.bundleMethodPromise = new Promise((resolve) => {
			bundleMethodPromiseResolve = resolve;
		});

		if (this.configurationLoadingPromise instanceof Promise) {
			await this.configurationLoadingPromise;
		}

		if (this.configFile && this.watchFiles && !this.configFileWatcherInitialized) {
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

			for (const [bundleOutputFile, bundleBuildCache] of Object.entries(this.bundlesBuildCache)) {
				if (!fs.existsSync(bundleOutputFile)) {
					continue;
				}

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
				// eslint-disable-next-line no-console
				console.table(tablesData);
			} else {
				this.log('No bundle was processed.', 'textRed');
			}

			this.log(`Build done (${((performance.now() - startTime)/1000).toFixed(2)} s).`);
		}

		bundleMethodPromiseResolve();
	}

	private processBundle(bundleConfig: BundleConfigInterface): void {
		const bundleRunner = async (): Promise<void> => {
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
				const bundleCompilerConfig = typeof bundleConfig.compiler === 'undefined'
					? this.compilerConfig
					: mergeObjects(this.compilerConfig, bundleConfig.compiler);

				try {
					const compiler = new Compiler(bundleCompilerConfig);

					const bundleCompilationResult = new CompilationResult({
						mangleSelectors: bundleCompilerConfig.mangleSelectors,
						reconfigurable: false
					});

					this.bundlesBuildCache[bundleConfig.outputFile] = {
						id: bundleConfig.id || null,
						compiler: compiler,
						compilationResult: bundleCompilationResult,
						buildTime: null,
						files: []
					};

					hooks.addListener(
						'compilationResult:configureCssRecord',
						({compilationResult, cssRecord}) => {
							if (compilationResult.id === bundleCompilationResult.id) {
								cssRecord.scope = bundleConfig.scope;
							}
						});
				} catch (error) {
					this.logOrError(error);
					return;
				}
			}

			const bundleBuildCache = this.bundlesBuildCache[bundleConfig.outputFile];
			const compiler = bundleBuildCache.compiler;

			const filesToProcess = await this.getFilesToProcess({
				bundleConfig,
				compiler,
				fileMasks: bundleConfig.files,
				isRoot: true
			});

			if (!filesToProcess.length) {
				this.log(`No files found for "${bundleConfig.outputFile}". Skipping.`, 'textRed');
				return;
			}

			const setupBundleWatcher = (pathsToWatch: string[]) => {
				for (const pathToWatch of pathsToWatch) {
					const isFileInWatchedFiles = pathToWatch in this.watchedFiles;

					if (isFileInWatchedFiles
						&& !this.watchedFiles[pathToWatch].bundlesIndexes.includes(bundleConfig.outputFile)
					) {
						this.watchedFiles[pathToWatch].bundlesIndexes.push(bundleConfig.outputFile);
						continue;
					}

					if (isFileInWatchedFiles) {
						continue;
					}

					this.watchedFiles[pathToWatch] = {
						bundlesIndexes: [bundleConfig.outputFile],
						processing: false,
						watcher: fs.watch(pathToWatch, (eventType, fileName) => {
							if (eventType !== 'change' || this.watchedFiles[pathToWatch].processing) {
								return;
							}

							const fullFilePath = pathToWatch === fileName
								? fileName
								: path.join(pathToWatch, fileName);

							const bundlesIndexes = this.watchedFiles[pathToWatch].bundlesIndexes;
							let changedInfoLogged = false;
							this.watchedFiles[pathToWatch].processing = true;

							for (const bundleToProcessIndex of bundlesIndexes) {
								const bundleConfig = this.bundles[bundleToProcessIndex];

								if (!micromatch.isMatch(fullFilePath, bundleConfig.files)) {
									continue;
								}

								if (!changedInfoLogged) {
									this.log(`"${pathToWatch}" changed.`, null, 2);
									changedInfoLogged = true;
								}

								const bundleHasCache = bundleToProcessIndex in this.bundlesBuildCache;
								this.processBundle({
									...bundleConfig,
									...bundleHasCache ? {files: [fullFilePath]} : {}
								});
							}

							this.waitOnBundlesProcessed().finally(() => {
								setTimeout(() => {
									this.watchedFiles[pathToWatch].processing = false;
									if (changedInfoLogged) {
										this.log(`Watching for changes...`, 'textYellow');
									}
								}, this.WATCH_FILE_DOUBLE_TRIGGER_BLOCK_TIMEOUT);
							});
						})
					};
				}

			};

			const filesToProcessPromises: Promise<any>[] = [];
			const filesToWatch: string[] = [];

			for (const fileToProcessConfig of filesToProcess) {
				const fileToProcessPath = fileToProcessConfig.filePath;

				if (!(fileToProcessPath in bundleBuildCache)) {
					bundleBuildCache.files.push(fileToProcessPath);

					if (this.watchFiles) {
						filesToWatch.push(fileToProcessPath);
					}
				}

				try {
					bundleBuildCache.compilationResult = compiler.compile(
						fileToProcessConfig.content,
						bundleBuildCache.compilationResult ?? null
					);

				} catch (error) {
					this.logOrError(error);
					continue;
				}

				if (bundleConfig.rewriteSelectorsInFiles) {
					const processedContent = compiler.rewriteSelectors(fileToProcessConfig.content);

					const beforeInputFileRewrittenHook = async (): Promise<void> => {
						const hookData = await hooks.callAsyncHook(
							'bundler:beforeInputFileRewritten',
							{
								bundleConfig,
								content: processedContent,
								filePath: fileToProcessConfig.filePath
							}
						);

						this.writeFile(hookData.filePath, hookData.content);
					};

					filesToProcessPromises.push(beforeInputFileRewrittenHook());
				}
			}

			if (filesToWatch.length) {
				const dirsToWatch: string[] = [];

				for (const fileToWatch of filesToWatch) {
					const parsedPath = path.parse(fileToWatch);
					const dirName = parsedPath.dir.length ? parsedPath.dir : fileToWatch;

					if (dirName in dirsToWatch) {
						continue;
					}

					let similarPathIndex: number = null;

					const similarPath = dirsToWatch.find((dirToWatch, index) => {
						const isSimilarPath = dirToWatch.startsWith(dirName);
						if (isSimilarPath) {
							similarPathIndex = index;
						}
						return isSimilarPath;
					});

					if (similarPath && dirName.length < similarPath.length) {
						dirsToWatch[similarPathIndex] = dirName;
						continue;
					} else if (!similarPath) {
						dirsToWatch.push(dirName);
					}
				}

				setupBundleWatcher([...filesToWatch, ...dirsToWatch]);
			}

			await Promise.all(filesToProcessPromises);

			const outputDir = path.dirname(bundleConfig.outputFile);

			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			let generatedCss = bundleBuildCache.compilationResult.generateCss();

			if (this.autoprefixerEnabled) {
				generatedCss = (await postCssPrefixer.process(generatedCss, {from: undefined})).css;
			} else {
				postcss.parse(generatedCss);
			}

			const hookData = await hooks.callAsyncHook(
				'bundler:beforeCssFileCreated', { content: generatedCss, bundleConfig }
			);

			let outputFileContent = hookData.content;
			const isDev = bundleBuildCache.compiler.dev;
			const whiteSpace = isDev ? '\n' : '';

			if (typeof bundleConfig.cssLayer !== 'undefined') {
				const layerName = this.cssLayersOrder.exportLayer;
				let layerContent = typeof layerName === 'undefined' || !layerName.includes(bundleConfig.cssLayer)
					? ''
					: `@layer ${this.cssLayersOrder.order};${whiteSpace.repeat(2)}`;
				layerContent += `@layer ${bundleConfig.cssLayer} {${whiteSpace}${outputFileContent}${whiteSpace}}`;
				outputFileContent = layerContent;
			}

			this.writeFile(hookData.bundleConfig.outputFile, outputFileContent, isDev);

			bundleBuildCache.buildTime = ((performance.now() - startTime)/1000).toFixed(2);
			this.log(`Created "${bundleConfig.outputFile}" (${bundleBuildCache.buildTime} s).`, 'textGreen');

			await hooks.callAsyncHook('bundler:bundleProcessed', { bundleConfig, bundleBuildCache });
		};

		const execBundleRunner = async () => {
			try {
				await bundleRunner();
			} catch (error) {
				delete this.bundlesBuildCache[bundleConfig.outputFile];
				console.error(error);
			}
		};

		this.processedBundlesQueue.push(execBundleRunner());
	}

	private logOrError(message: string): void {
		if (this.watchFiles) {
			console.error(message);
		} else {
			throw new Error(message);
		}
	}

	private async getFilesToProcess(options: GetFilesToProcessOptionsInterface): Promise<BundleFileDataInterface[]> {
		const { bundleConfig, isRoot, compiler } = options;
		let { fileMasks } = options;
		fileMasks = fileMasks.map((fileMask: string): string => {
			return normalize(fileMask) as string;
		});

		const filesBaseDir: string = typeof bundleConfig.filesBaseDir === 'string'
			? normalize(bundleConfig.filesBaseDir)
			: null;

		const filePaths = FastGlob.sync(fileMasks);

		let filesToProcess: BundleFileDataInterface[] = [];
		const processedFilePaths: Promise<void>[] = [];

		for (const filePath of filePaths) {
			const processFilePath = async (filePath: string) => {
				if (!this.checkIfFileExists(filePath)) {
					return;
				}

				const fileContent = fs.readFileSync(filePath).toString();
				const contentOptions = compiler.getOptionsFromContent<ContentOptionsInterface>(fileContent);

				const hookData = await hooks.callAsyncHook(
					'bundler:fileToProcessOpened',
					{
						bundleConfig,
						filePath,
						contentOptions,
						isRoot,
						content: fileContent
					}
				);

				filesToProcess.push({
					filePath: filePath,
					content: hookData.content
				});

				const filePathsFromContent: string[] = hookData.contentOptions.files ?? [];

				if (filePathsFromContent.length) {
					const filePathsToProcess: string[] = [];

					filePathsFromContent
						.join(' ')
						.split(' ')
						.forEach((fileOptionValue) => {
							if (fileOptionValue.trim().length === 0) {
								return;
							}

							let filePathToNormalize = path.join(path.dirname(filePath), fileOptionValue);

							if (fileOptionValue.startsWith(path.sep)) {
								filePathToNormalize = filesBaseDir
									? path.join(filesBaseDir, fileOptionValue)
									: fileOptionValue;
							}

							filePathsToProcess.push(normalize(filePathToNormalize) as string);
						});

					const nestedFilePaths = await this.getFilesToProcess({
						bundleConfig,
						compiler,
						fileMasks: this.clearFilePaths(filePathsToProcess),
						isRoot: false
					});
					filesToProcess = [...filesToProcess, ...nestedFilePaths];
				}

				if (this.checkIfFileExists(hookData.filePath)) {
					filesToProcess.push({
						filePath: hookData.filePath,
						content: hookData.content
					});
				}
			};

			processedFilePaths.push(processFilePath(filePath));
		}

		await Promise.all(processedFilePaths);

		return filesToProcess;
	}

	private writeFile(filePath: string, fileContent: string, trailingNewLine = true): void {
		let newLine = '\n';

		if (!trailingNewLine) {
			newLine = '';
		}

		const newFileContent = fileContent.trim() + newLine;

		try {
			const actualFileContent = this.createdFilesContentCache[filePath]
				?? fs.readFileSync(filePath).toString('utf-8');

			if (actualFileContent === newFileContent) {
				return;
			}
		} catch (e) {
			this.log(`Stylify Bundler: File "${filePath}" not found. It will be created.`);
		}

		this.createdFilesContentCache[filePath] = newFileContent;
		fs.writeFileSync(filePath, newFileContent);
	}

	private checkIfFileExists(filePath: string): boolean {
		const exists = fs.existsSync(filePath);

		if (!exists) {
			this.log(`File "${filePath}" not found. Skipping.`, 'textRed');
		}

		return exists;
	}

	private clearFilePaths(filePaths: string[]): string[] {
		const clearedFilePaths: string[] = [];
		for (const filePath of filePaths) {
			if (!this.checkIfFileExists(filePath)) {
				continue;
			}
			clearedFilePaths.push(filePath);
		}

		return clearedFilePaths;
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
