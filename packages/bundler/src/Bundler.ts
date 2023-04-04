import FastGlob from 'fast-glob';
import micromatch from 'micromatch';
import type {
	CompilerConfigInterface,
	CompilerContentOptionsInterface,
	DefaultHooksListInterface
} from '@stylify/stylify';
import {
	mergeObjects,
	createUId,
	CompilationResult,
	Compiler,
	Hooks
} from '@stylify/stylify';
import fs from 'fs';
import chokidar from 'chokidar';
import { default as normalize } from 'normalize-path';
import path from 'path';
import { performance } from 'perf_hooks';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

export interface BundleFileDataInterface {
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
	outputFile: string,
	files: string|string[],
	id?: string,
	rewriteSelectorsInFiles?: boolean,
	filesBaseDir?: string,
	scope?: string,
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
	configFile?: string|string[],
	autoprefixerEnabled?: boolean,
	compiler?: CompilerConfigInterface,
	filesBaseDir?: string,
	verbose?: boolean,
	showBundlesStats?: boolean,
	watchFiles?: boolean,
	sync?: boolean,
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
	bundles?: BundleConfigInterface[],
	cssLayersOrder?: CSSLayersOrderInterface,
}

export interface WatchedFileInterface {
	watcher: fs.FSWatcher,
	processing: boolean,
	bundlesIndexes: string[]
}

export interface GetFilesToProcessOptionsInterface {
	bundleConfig: BundleConfigInterface,
	compiler: Compiler,
	filePaths?: string[],
	fileMasks?: string[],
}

interface RawConfigurationsInterface {
	configFile: string|null;
	config: Partial<BundlerConfigInterface>;
}

const postCssPrefixer = postcss([autoprefixer()]);

export type BundlerHooksNamesListType = keyof BundlerHooksListInterface;

export const hooks = new Hooks<BundlerHooksListInterface>;

export const defineConfig = (config: BundlerConfigInterface): BundlerConfigInterface => config;

export class Bundler {

	public id: string = createUId();

	private processedBundlesQueue: Promise<void>[] = [];

	private bundleMethodPromise: Promise<void> = null;

	private isReloadingConfiguration = false;

	private watchedFiles: Record<string, WatchedFileInterface> = {};

	private configFilesWatcher: fs.FSWatcher = null;

	private configurationLoadingPromise: Promise<void> = null;

	private configFiles: string[] = [];

	private rawConfigurations: RawConfigurationsInterface[] = [];

	private configFilesWatcherInitialized = false;

	private dev = false;

	private filesBaseDir: string = null;

	private verbose = false;

	private showBundlesStats = false;

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
		this.dev = config.dev ?? this.dev;
		this.compilerConfig.dev = this.dev;
		this.compilerConfig = mergeObjects(this.compilerConfig, config.compiler ?? {});
		this.verbose = config.verbose ?? this.verbose;
		this.sync = config.sync ?? this.sync;
		this.watchFiles = config.watchFiles ?? this.watchFiles;
		this.showBundlesStats = config.showBundlesStats ?? !this.watchFiles;
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

	private async loadConfigFile(configFile: string): Promise<void> {
		try {
			const isCommonJs = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
			const isWindows = process.platform === 'win32';
			// The config must be at first without ?cache=, because require.cache saves pure path without this suffix
			// so if added before delete, the file cache is not cleaned
			const configToImport = isWindows ? `file://${configFile.replace(/^\/+/, '')}` : configFile;
			let importedConfig: any;

			if (isCommonJs) {
				delete require.cache[configToImport];
			}

			try {
				importedConfig = await import(`${configToImport}?cache=${new Date().getTime()}`);
			} catch (importError) {
				importedConfig = await import(configToImport);
			}

			importedConfig = importedConfig?.default ?? importedConfig;

			if (typeof importedConfig === 'function') {
				importedConfig = importedConfig();
			}

			await this.configure(importedConfig as Partial<BundlerConfigInterface>, configFile);
		} catch (error) {
			throw new Error(`Error occured while processing config file "${configFile}": ${error as string}`);
		}
	}

	public async configure(config: BundlerConfigInterface, fromConfigFile: string = null): Promise<void> {
		let configFiles: string[] = [];
		const configOptionType = typeof config.configFile;

		if (configOptionType !== 'undefined') {
			configFiles = (configOptionType === 'string' ? [config.configFile] : config.configFile) as string[];
			config.configFile = configFiles.map((file) => normalize(file) as string);
		}

		const rawConfig = {
			config,
			configFile: fromConfigFile
		};

		let rawConfigIndex = -1;

		if (fromConfigFile) {
			rawConfigIndex = this.rawConfigurations.findIndex((rawConfig) => rawConfig.configFile === fromConfigFile);
		}

		if (rawConfigIndex > -1) {
			this.rawConfigurations[rawConfigIndex] = rawConfig;
		} else {
			this.rawConfigurations.push(rawConfig);
		}

		this.id = config.id ?? this.id;

		this.mergeConfigs(config);

		const configLoadingPromises = [];

		for (const configFile of config.configFile ?? []) {
			if (this.configFiles.includes(configFile)) {
				continue;
			}

			if (!fs.existsSync(configFile)) {
				this.log(`Configuration file "${configFile}" not found.`, 'textRed');
				continue;
			}

			this.configFiles.push(configFile);
			configLoadingPromises.push(this.loadConfigFile(configFile));
		}

		if (configLoadingPromises.length) {
			await Promise.all(configLoadingPromises);
		}

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
			bundle.outputFile = normalize(bundle.outputFile);
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

		if (bundles) {
			this.addBundles(bundles);
		}

		const startTime = performance.now();

		for (const bundleConfig of Object.values(this.bundles)) {
			this.processBundle({ bundleConfig, setupBundleWatcher: true});
		}

		if (this.sync) {
			await Promise.all(this.processedBundlesQueue);
			this.processedBundlesQueue = [];
		}

		if (this.watchFiles) {
			this.log(`Waching for changes...`, 'textYellow');

		} else if (this.showBundlesStats) {
			let buildsInfo = [];

			for (const [bundleOutputFile, bundleBuildCache] of Object.entries(this.bundlesBuildCache)) {
				if (!fs.existsSync(bundleOutputFile)) {
					continue;
				}

				let bundleInfoName = bundleBuildCache.id ?? bundleOutputFile;
				const maxBundleInfoFileNameLength = 60;
				if (bundleInfoName.length > maxBundleInfoFileNameLength) {
					bundleInfoName = [
						bundleInfoName.slice(0, maxBundleInfoFileNameLength / 2),
						bundleInfoName.slice(
							bundleInfoName.length - maxBundleInfoFileNameLength / 2, bundleInfoName.length
						)
					].join('.....');
				}

				buildsInfo.push({
					name: bundleInfoName,
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
		this.startWatchingConfigFiles();
	}

	public stop(options: {
		watchedFile?: WatchedFileInterface,
		stopConfigFileWatchers?: boolean
	} = {}): void {
		const stopWatcher = (watcher: fs.FSWatcher) => watcher.close();

		if (typeof options.watchedFile !== 'undefined') {
			stopWatcher(options.watchedFile.watcher);
			return;
		}

		for (const watchedFile of Object.values(this.watchedFiles)) {
			stopWatcher(watchedFile.watcher);
		}

		if ((options.stopConfigFileWatchers ?? true) && this.configFilesWatcher) {
			stopWatcher(this.configFilesWatcher);
		}
	}

	public async restart(stopConfigFileWatchers = true) {
		const rawConfigurations = this.rawConfigurations;
		this.rawConfigurations = [];

		try {
			this.isReloadingConfiguration = true;
			this.stop({ stopConfigFileWatchers });
			this.compilerConfig = {};
			this.bundlesBuildCache = {};
			this.processedBundlesQueue = [];
			this.watchedFiles = {};

			let resolveConfigurationLoading: CallableFunction;
			this.configurationLoadingPromise = new Promise((resolve) => {
				resolveConfigurationLoading = resolve;
			});

			const configLoadingPromises = [];

			for (const rawConfiguration of rawConfigurations) {
				if (rawConfiguration.configFile) {
					configLoadingPromises.push(this.loadConfigFile(rawConfiguration.configFile));

				} else {
					configLoadingPromises.push(this.configure(rawConfiguration.config));
				}
			}

			await Promise.all(configLoadingPromises);

			resolveConfigurationLoading();
			await this.bundle();
			this.configurationLoadingPromise = null;
			this.logInfoAboutWatchingConfigFiles();
			this.log('Bundler restarted', 'textGreen', null, 1);

		} catch (error) {
			this.log('Bundler restart failed.', 'textRed');
			this.log(error as string);
			this.rawConfigurations = rawConfigurations;
		}

		this.isReloadingConfiguration = false;
	}

	private logInfoAboutWatchingConfigFiles() {
		this.log(
			`Watching config file${this.configFiles.length > 1 ? 's' : ''} "${this.configFiles.join(', ')}" for changes...`,
			'textYellow'
		);
	}

	private startWatchingConfigFiles() {
		if (this.configFiles.length === 0 || !this.watchFiles || this.configFilesWatcherInitialized) {
			return;
		}

		this.configFilesWatcher = chokidar.watch(this.configFiles, {
			ignoreInitial: true
		}).on('change', (file): void => {
			if (this.isReloadingConfiguration) {
				return;
			}

			this.log(`File "${file}" changed. Reloading.`, 'textYellow');
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			this.restart(false);
		});

		this.logInfoAboutWatchingConfigFiles();

		this.configFilesWatcherInitialized = true;
	}

	private processBundle(config: {
		bundleConfig: BundleConfigInterface,
		processBundleFilesNotMask?: boolean,
		setupBundleWatcher?: boolean
	}): void {
		const bundleConfig = config.bundleConfig;
		const processBundleFilesNotMask = config.processBundleFilesNotMask ?? false;
		const shouldSetupBundleWatcher = config.setupBundleWatcher ?? false;

		const bundleRunner = async (): Promise<void> => {
			if (typeof bundleConfig.files === 'undefined') {
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
							cssRecord.configure({ scope: bundleConfig.scope });
						}
					});
			}

			const bundleBuildCache = this.bundlesBuildCache[bundleConfig.outputFile];
			const compiler = bundleBuildCache.compiler;

			const filesToProcess = await this.getFilesToProcess({
				bundleConfig,
				compiler,
				[processBundleFilesNotMask ? 'filePaths' : 'fileMasks']: bundleConfig.files
			});

			if (!Object.keys(filesToProcess).length) {
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
						watcher: chokidar.watch(pathToWatch, {
							ignoreInitial: true
						}).on('all', (eventType, fileName) => {
							let isDir: boolean;
							try {
								isDir = fs.lstatSync(pathToWatch).isDirectory();
							} catch (e) {
								return;
							}

							if (
								isDir && eventType === 'change'
								|| this.watchedFiles[pathToWatch].processing
							) {
								return;
							}

							const bundlesIndexes = this.watchedFiles[pathToWatch].bundlesIndexes;
							let changedInfoLogged = false;
							this.watchedFiles[pathToWatch].processing = true;

							for (const bundleToProcessIndex of bundlesIndexes) {
								const bundleConfig = this.bundles[bundleToProcessIndex];

								if (!micromatch.isMatch(fileName, bundleConfig.files)) {
									continue;
								}

								if (!changedInfoLogged) {
									this.log(`"${fileName}" changed.`, null, 1);
									changedInfoLogged = true;
								}

								if (!this.checkIfFileExists(fileName)) {
									continue;
								}

								const bundleCache = this.bundlesBuildCache[bundleConfig.outputFile] ?? null;

								this.processBundle({
									bundleConfig: { ...bundleConfig, ...bundleCache ? {files: [fileName]} : {} },
									processBundleFilesNotMask: bundleCache !== null
								});
							}

							this.waitOnBundlesProcessed().finally(() => {
								this.watchedFiles[pathToWatch].processing = false;
								if (changedInfoLogged) {
									this.log(`Watching for changes...`, 'textYellow');
								}
							});
						})
					};
				}

			};

			const filesToProcessPromises: Promise<any>[] = [];
			const filesToWatch: string[] = [];

			for (const [fileToProcessPath, fileToProcessConfig] of Object.entries(filesToProcess)) {
				if (!(fileToProcessPath in bundleBuildCache)) {
					bundleBuildCache.files.push(fileToProcessPath);

					if (this.watchFiles) {
						filesToWatch.push(fileToProcessPath);
					}
				}

				bundleBuildCache.compilationResult = compiler.compile(
					fileToProcessConfig.content,
					bundleBuildCache.compilationResult ?? null
				);

				if (bundleConfig.rewriteSelectorsInFiles) {
					const processedContent = compiler.rewriteSelectors(fileToProcessConfig.content);

					const beforeInputFileRewrittenHook = async (): Promise<void> => {
						const hookData = await hooks.callAsyncHook(
							'bundler:beforeInputFileRewritten',
							{
								bundleConfig,
								content: processedContent,
								filePath: fileToProcessPath
							}
						);

						this.writeFile(hookData.filePath, hookData.content);
					};

					filesToProcessPromises.push(beforeInputFileRewrittenHook());
				}
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
				const exportLayerName = this.cssLayersOrder?.exportLayer;
				let layerContent =
					typeof exportLayerName === 'undefined' || !exportLayerName.includes(bundleConfig.cssLayer)
						? ''
						: `@layer ${this.cssLayersOrder.order};${whiteSpace.repeat(2)}`;
				layerContent += `@layer ${bundleConfig.cssLayer} {${whiteSpace + outputFileContent + whiteSpace}}`;
				outputFileContent = layerContent;
			}

			this.writeFile(hookData.bundleConfig.outputFile, outputFileContent, isDev);

			bundleBuildCache.buildTime = ((performance.now() - startTime)/1000).toFixed(2);
			this.log(`Created "${bundleConfig.outputFile}" (${bundleBuildCache.buildTime} s).`, 'textGreen');

			await hooks.callAsyncHook('bundler:bundleProcessed', { bundleConfig, bundleBuildCache });

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

				if (shouldSetupBundleWatcher) {
					setupBundleWatcher([...new Set([...filesToWatch, ...dirsToWatch])]);
				}
			}
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

	private async getFilesToProcess(
		options: GetFilesToProcessOptionsInterface
	): Promise<Record<string, BundleFileDataInterface>> {
		const { bundleConfig, compiler } = options;
		let { fileMasks, filePaths } = options;

		if (typeof fileMasks !== 'undefined') {
			fileMasks = [...new Set([
				...fileMasks,
				...fileMasks.map((fileMask: string): string => normalize(fileMask) as string)
			])];

			filePaths = FastGlob.sync(fileMasks);
		}

		filePaths = filePaths ?? [];

		const filesToProcess: Record<string, BundleFileDataInterface> = {};

		const addFileToProcess = (path: string, data: BundleFileDataInterface) => {
			if (path in filesToProcess) {
				return;
			}

			filesToProcess[path] = data;
		};

		const processedFilePaths: Promise<void>[] = [];
		const filesBaseDir: string = typeof bundleConfig.filesBaseDir === 'string'
			? normalize(bundleConfig.filesBaseDir)
			: null;

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

				if (this.checkIfFileExists(hookData.filePath)) {
					addFileToProcess(hookData.filePath, {
						content: hookData.content
					});
				}

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
						fileMasks: this.clearFilePaths(filePathsToProcess)
					});
					for (const path in nestedFilePaths) {
						addFileToProcess(path, nestedFilePaths[path]);
					}
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
			this.log(`File "${filePath}" not found. It will be created.`);
		}

		this.createdFilesContentCache[filePath] = newFileContent;
		fs.writeFileSync(filePath, newFileContent);
	}

	private checkIfFileExists(filePath: string): boolean {
		const exists = fs.existsSync(filePath);

		if (!exists) {
			this.log(`File "${filePath}" not found. Skipping.`, 'textRed');
			this.watchedFiles[filePath]?.watcher.close();
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
		colorName: 'reset'|'textWhite'|'textCyan'|'textRed'|'textGreen'|'textYellow' = null,
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
			textGrey: '\x1b[90m',
			textGreen: '\x1b[32m',
			textYellow: '\x1b[33m'
		};

		const logEmptyLines = (count) => {
			while (count --) {
				// eslint-disable-next-line no-console
				console.log('\n');
			}
		};

		if (newLinesBeforeCount) {
			logEmptyLines(newLinesBeforeCount);
		}

		const logTime = new Date().toLocaleDateString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		}).replace(/^\S+\s+/, '');

		// eslint-disable-next-line no-console
		console.log(
			`${colors.textGrey}${logTime}${colors.reset}`,
			`${colorName ? colors[colorName] : colors.reset}[stylify] ${content}`,
			colors.reset
		);

		if (newLinesAfterCount) {
			logEmptyLines(newLinesAfterCount);
		}
	}

}
