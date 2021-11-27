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
	callback?: (
		bundleConfig: BundleConfigInterface, bundleBuildCache: BundlesBuildCacheInterface
	) => void | Promise<void>
}

interface BundleInterface extends BundleConfigInterface {
	index: number
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
	compilerConfig: CompilerConfigInterface,
	verbose?: boolean,
	watchFiles?: boolean,
	sync?: boolean,
	cssVarsDirPath?: string,
	sassVarsDirPath?: string,
	lessVarsDirPath?: string,
	stylusVarsDirPath?: string,
}

export interface WatchedFilesInterface {
	watcher: fs.FSWatcher,
	bundlesIndexes: number[]
}

export class Bundler {

	private bundlesBuildCache: BundlesBuildCacheType = {};

	private processedBundlesQueue: Promise<void>[] = [];

	private bundles: BundleInterface[] = [];

	private isReloadingConfiguration = false;

	private watchedFiles: Record<string, WatchedFilesInterface> = {};

	private configurationLoadingPromise: Promise<void> = null;

	private config: BundlerConfigInterface = {
		configFile: null,
		compilerConfig: null,
		verbose: true,
		sync: true,
		watchFiles: false,
		cssVarsDirPath: null,
		sassVarsDirPath: null,
		lessVarsDirPath: null,
		stylusVarsDirPath: null
	}

	public constructor(config: BundlerConfigInterface) {
		this.configurationLoadingPromise = this.configure(config);
	}

	public async configure(config: BundlerConfigInterface): Promise<void> {
		this.config = {
			...this.config,
			...config
		};

		if (this.config.configFile) {
			if (!fs.existsSync(this.config.configFile)) {
				this.log(`Configuration file "${this.config.configFile}" not found.`, 'textRed');
				return;
			}

			const loadFileConfig = async (): Promise<void> => {
				const fileConfig = await import(this.config.configFile);

				this.config = {
					...this.config,
					...fileConfig
				};
			};

			await loadFileConfig();

			if (this.config.watchFiles && !this.isReloadingConfiguration) {
				fs.watchFile(this.config.configFile, () => {
					this.configurationLoadingPromise = new Promise((resolveConfigurationLoading) => {
						this.isReloadingConfiguration = true;
						this.bundlesBuildCache = {};
						this.processedBundlesQueue = [];
						for (const watchedFile in this.watchedFiles) {
							this.watchedFiles[watchedFile].watcher.close();
						}
						loadFileConfig().finally(() => {
							resolveConfigurationLoading();
							this.configurationLoadingPromise = null;
							this.log('Configuration reloaded.', 'textGreen');
							this.bundle(this.bundles).finally(() => {
								this.isReloadingConfiguration = false;
							});
						});
					});
				});
			}
		}

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

		if (this.config.cssVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.config.cssVarsDirPath,
				fileType: 'css',
				variablePrefix: '--',
				variableValueSeparator: ': ',
				afterValue: ';',
				fileContentPrefix: ':root {\n',
				fileContentSuffix: '\n}'
			});
		}

		if (this.config.sassVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.config.sassVarsDirPath,
				fileType: 'scss',
				variablePrefix: '$',
				variableValueSeparator: ': ',
				afterValue: ';'
			});
		}

		if (this.config.lessVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.config.lessVarsDirPath,
				fileType: 'less',
				variablePrefix: '@',
				variableValueSeparator: ': '
			});
		}

		if (this.config.stylusVarsDirPath) {
			this.dumpVariablesIntoFile({
				filePath: this.config.stylusVarsDirPath,
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

		for (const variable in this.config.compilerConfig.variables) {
			const variableValue = this.config.compilerConfig.variables[variable];
			fileVariablesContent += `${variablePrefix}${variable}${variableValueSeparator}${variableValue}${afterValue}\n`;
		}

		if (!fs.existsSync(options.filePath)) {
			fs.mkdirSync(options.filePath);
		}

		fileVariablesContent += options.fileContentSuffix || '';

		fs.writeFileSync(
			path.join(options.filePath, `stylify-variables.${options.fileType}`),
			fileVariablesContent
		);
	}

	public async waitOnBundlesProcessed(): Promise<void> {
		if (this.processedBundlesQueue.length) {
			await Promise.all(this.processedBundlesQueue);
		}
	}

	public findBundleCache(id: string): BundlesBuildCacheInterface | null {
		return Object.values(this.bundlesBuildCache).find((value): boolean => value.id === id) || null;
	}

	public async bundle(bundles: BundleConfigInterface[] | BundleInterface[]): Promise<void> {
		if (this.configurationLoadingPromise instanceof Promise) {
			await this.configurationLoadingPromise;
		}

		let bundlesToProcess: BundleInterface[] = [];

		if (this.isReloadingConfiguration) {
			bundlesToProcess = bundles as BundleInterface[];

		} else {
			for (const bundle of bundles) {
				const bundleToProcess = {
					...bundle,
					...{
						index: this.bundles.length,
						rewriteSelectorsInFiles: 'rewriteSelectorsInFiles' in bundle
							? bundle.rewriteSelectorsInFiles
							: bundle.mangleSelectors
					}
				};
				bundlesToProcess.push(bundleToProcess);
				this.bundles.push(bundleToProcess);
			}
		}

		const startTime = performance.now();

		for (const bundleConfig of bundlesToProcess) {
			this.processBundle(bundleConfig);
		}

		if (this.config.sync) {
			await Promise.all(this.processedBundlesQueue);
			this.processedBundlesQueue = [];
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
		this.processedBundlesQueue.push(new Promise((resolve): void => {
			const startTime = performance.now();
			this.log(`Processing ${bundleConfig.outputFile}.`, 'textCyan');

			if (!(bundleConfig.outputFile in this.bundlesBuildCache)) {
				const originalOnPrepareCompilationResultFunction =
					this.config.compilerConfig.onPrepareCompilationResult;

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
				this.log(`No files found for ${bundleConfig.outputFile}. Skipping.`, 'textRed');
				return;
			}

			for (const fileToProcessConfig of filesToProcess) {
				const fileToProcessPath = fileToProcessConfig.filePath;
				if (!fs.existsSync(fileToProcessPath)) {
					this.log(`File ${fileToProcessPath} not found. Skipping`, 'textRed');
					continue;
				}

				if (!(fileToProcessPath in bundleBuildCache)) {
					bundleBuildCache.files.push(fileToProcessPath);
					if (this.config.watchFiles) {
						if (fileToProcessPath in this.watchedFiles) {
							this.watchedFiles[fileToProcessPath].bundlesIndexes.push(bundleConfig.index);
						} else {
							this.watchedFiles[fileToProcessPath] = {
								bundlesIndexes: [bundleConfig.index],
								watcher: fs.watch(fileToProcessPath, () => {
									this.log(`${fileToProcessPath} changed.`, null, 2);
									const bundlesIndexes = this.watchedFiles[fileToProcessPath].bundlesIndexes;

									for (const bundleToProcessIndex of bundlesIndexes) {
										this.processBundle({
											...this.bundles[bundleToProcessIndex],
											...{files: [fileToProcessPath]}
										});
									}

									this.log(`Waching for changes...`, 'textYellow');
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
			this.log(`Created ${bundleConfig.outputFile} (${bundleBuildCache.buildTime} s).`, 'textGreen');
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
			colorName ? colors[colorName] : colors.reset,
			`[${logTime}] @stylify/bundler: ${content}`,
			colors.reset
		);
	}

}
