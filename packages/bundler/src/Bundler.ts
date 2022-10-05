import FastGlob from 'fast-glob';
import {
	CompilerConfigInterface,
	CompilerContentOptionsInterface,
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

interface BundleFileDataInterface {
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
		content: string
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
	compiler?: CompilerConfigInterface
}

export interface BundlerConfigInterface {
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
	bundles?: BundleConfigInterface[]
}

export interface WatchedFilesInterface {
	watcher: fs.FSWatcher,
	processing: boolean,
	bundlesIndexes: string[]
}

const postCssPrefixer = postcss([autoprefixer()]);

export type BundlerHooksNamesListType = keyof BundlerHooksListInterface;

export const hooks = new Hooks<BundlerHooksListInterface>;

export const defineConfig = (config: BundlerConfigInterface): BundlerConfigInterface => config;

export class Bundler {

	private readonly WATCH_FILE_DOUBLE_TRIGGER_BLOCK_TIMEOUT = 500;

	private processedBundlesQueue: Promise<void>[] = [];

	private isReloadingConfiguration = false;

	private watchedFiles: Record<string, WatchedFilesInterface> = {};

	private configurationLoadingPromise: Promise<void> = null;

	private configFile: string = null;

	private configFileWatcherInitialized = false;

	/**
	 * @internal
	 */
	public compilerConfig: CompilerConfigInterface = {};

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

	public bundlesBuildCache: BundlesBuildCacheType = {};

	public constructor(config: BundlerConfigInterface) {
		this.configurationLoadingPromise = this.configure(config);
	}

	private mergeConfigs(config: Partial<BundlerConfigInterface>) {
		this.configFile = config.configFile || this.configFile;
		this.dev = config.dev ?? this.dev;
		this.compilerConfig.dev = this.dev;
		this.compilerConfig = mergeObjects(this.compilerConfig, config.compiler ?? {});
		this.verbose = config.verbose ?? this.verbose;
		this.sync = config.sync ?? this.sync;
		this.watchFiles = config.watchFiles ?? this.watchFiles;
		this.filesBaseDir = config.filesBaseDir ?? this.filesBaseDir;

		this.cssVarsDirPath = config.cssVarsDirPath ?? this.cssVarsDirPath;
		this.sassVarsDirPath = config.sassVarsDirPath ?? this.sassVarsDirPath;
		this.lessVarsDirPath = config.lessVarsDirPath ?? this.lessVarsDirPath;
		this.stylusVarsDirPath = config.stylusVarsDirPath ?? this.stylusVarsDirPath;

		this.autoprefixerEnabled = config.autoprefixerEnabled ?? this.autoprefixerEnabled;

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

		this.configurationLoadingPromise = null;
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
		if (this.processedBundlesQueue.length) {
			await Promise.all(this.processedBundlesQueue);
		}
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

			const filesToProcess = await this.getFilesToProcess(bundleConfig, compiler, bundleConfig.files);

			if (!filesToProcess.length) {
				this.log(`No files found for "${bundleConfig.outputFile}". Skipping.`, 'textRed');
				return;
			}

			const filesToProcessPromises = [];

			for (const fileToProcessConfig of filesToProcess) {
				const fileToProcessPath = fileToProcessConfig.filePath;

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

				try {
					bundleBuildCache.compilationResult = compiler.compile(
						fileToProcessConfig.content,
						bundleBuildCache.compilationResult ?? null
					);

				} catch (error) {
					this.logOrError(error);
					return;
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

						this.writeFile(hookData.filePath, hookData.content, false);
					};

					filesToProcessPromises.push(beforeInputFileRewrittenHook());
				}
			}

			await Promise.all(filesToProcessPromises);

			const outputDir = path.dirname(bundleConfig.outputFile);

			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			const generatedCss = bundleBuildCache.compilationResult.generateCss();
			const cssToSave = this.autoprefixerEnabled
				? (await postCssPrefixer.process(generatedCss, {from: undefined})).css
				: generatedCss;

			const hookData = await hooks.callAsyncHook(
				'bundler:beforeCssFileCreated', { content: cssToSave, bundleConfig }
			);

			this.writeFile(hookData.bundleConfig.outputFile, hookData.content);

			bundleBuildCache.buildTime = ((performance.now() - startTime)/1000).toFixed(2);
			this.log(`Created "${bundleConfig.outputFile}" (${bundleBuildCache.buildTime} s).`, 'textGreen');

			await hooks.callAsyncHook('bundler:bundleProcessed', { bundleConfig, bundleBuildCache });
		};

		this.processedBundlesQueue.push(bundleRunner());
	}

	private logOrError(message: string): void {
		if (this.watchFiles) {
			console.error(message);
		} else {
			throw new Error(message);
		}
	}

	private async getFilesToProcess(
		bundleConfig: BundleConfigInterface,
		compiler: Compiler,
		filesMasks: string[] = []
	): Promise<BundleFileDataInterface[]> {
		filesMasks = filesMasks.map((fileMask: string): string => {
			return normalize(fileMask) as string;
		});

		const filesBaseDir: string = typeof bundleConfig.filesBaseDir === 'string'
			? normalize(bundleConfig.filesBaseDir)
			: null;

		const filePaths = FastGlob.sync(filesMasks);

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

					const nestedFilePaths = await this.getFilesToProcess(
						bundleConfig, compiler, this.clearFilePaths(filePathsToProcess)
					);
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
		let newLine = this.compilerConfig.dev ? '\n' : '';

		if (!trailingNewLine) {
			newLine = '';
		}

		fs.writeFileSync(filePath, `${fileContent.trim() + newLine}`);
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
