import { BundleConfigInterface, BundlerConfigInterface, Bundler } from '@stylify/bundler';
import {
	Compiler,
	Configurator,
	DefaultConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import process from 'process';
import { createUnplugin } from 'unplugin';

export interface UnpluginConfigInterface extends DefaultConfigInterface {
	id?: string,
	configFile?: string,
	bundles?: BundleConfigInterface[];
	dev?: boolean;
	bundler?: BundlerConfigInterface;
	transformIncludeFilter?: (id: string) => boolean;
}

const defaultAllowedFileTypes = [
	// Html
	'html', 'htm', 'xml', 'xhtml', 'xht',
	// Javascript
	'vue', 'jsx', 'tsx', 'js', 'cjs', 'mjs', 'ts', 'svelte', 'astro',
	// PHP
	'php', 'phtml', 'twig', 'latte', 'tpl', 'pug', 'haml',
	// Python
	'py',
	// Java
	'java',
	// Golang
	'go',
	// Rust
	'rs',
	// C#, .NET and similar
	'cs', 'asp', 'aspx',
	// Other
	'json', 'md', 'txt'
];

const defaultIgnoredDirectories = [
	'node_modules',
	'vendor',
	'tmp',
	'log',
	'cache',
	'\\.devcontainer',
	'\\.github',
	'\\.git'
];

export const defineConfig = (config: UnpluginConfigInterface): UnpluginConfigInterface => config;

const defaultAllowedTypesRegExp = new RegExp(`\\.(?:${defaultAllowedFileTypes.join('|')})\\b`);
const defaultIgnoredDirectoriesRegExp = new RegExp(`/${defaultIgnoredDirectories.join('|')}/`);
const bundlers: Record<string, Bundler> = {};
const transformCompilers: Record<string, Compiler> = {};

export const unplugin = createUnplugin((config: UnpluginConfigInterface|UnpluginConfigInterface[] = {}) => {
	const pluginName = 'stylify';
	let pluginConfig: UnpluginConfigInterface = {};
	let configured = false;
	let configurationLoadingPromise: Promise<void> | null = null;

	const waitForConfiguratinToLoad = async (): Promise<void> => {
		if (configurationLoadingPromise !== null) {
			await configurationLoadingPromise;
		}
	};

	const configure = async (): Promise<void> => {
		if (configured) {
			return;
		}

		let pluginConfigured = null;
		configurationLoadingPromise = new Promise((resolve) => {
			pluginConfigured = () => {
				resolve();
				configurationLoadingPromise = null;
				configured = true;
			};
		});

		const pluginCustomConfig: UnpluginConfigInterface = mergeObjects(...Array.isArray(config) ? config : [config]);

		let configsToProcess: (UnpluginConfigInterface|string)[] = [
			{
				id: 'default',
				bundles: [],
				bundler: {
					compiler: {}
				},
				transformIncludeFilter: (id: string) =>
					defaultAllowedTypesRegExp.test(id) && !defaultIgnoredDirectoriesRegExp.test(id)
			},
			pluginCustomConfig
		];

		const configurator = new Configurator();
		const defaultConfigFiles = Configurator.getDefaultExistingConfigFiles(process.cwd());

		configsToProcess = [...configsToProcess, ...Object.values(defaultConfigFiles)];

		if (pluginCustomConfig.configFile) {
			configsToProcess.push(pluginCustomConfig.configFile);
			delete pluginCustomConfig.configFile;
		}

		pluginConfig = await configurator.processConfigs(configsToProcess);

		pluginConfigured();
	};

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	configure();

	const getBundler = (): Bundler => {
		if (typeof pluginConfig.dev === 'undefined' && typeof process.env['NODE_ENV'] !== 'undefined') {
			pluginConfig.dev = process.env['NODE_ENV'] !== 'test';
			pluginConfig.bundler.dev = pluginConfig?.bundler?.dev ?? pluginConfig.dev;
			pluginConfig.bundler.compiler.mangleSelectors = shouldMangleSelectors();
		}

		let bundler = bundlers[pluginConfig.id] ?? null;

		if (pluginConfig.dev || !bundler) {
			bundler = new Bundler(mergeObjects(
				{
					compiler: pluginConfig.compiler ?? {},
					bundles: pluginConfig.bundles
				},
				pluginConfig.bundler
			) as BundleConfigInterface);
			bundlers[pluginConfig.id] = bundler;
		}

		return bundler;
	};

	const runBundler = async () => {
		if (typeof bundlers[pluginConfig.id] !== 'undefined') {
			await getBundler().waitOnBundlesProcessed();
		}

		const bundlerRunner = getBundler();
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		bundlerRunner.bundle();
		await bundlerRunner.waitOnBundlesProcessed();
	};


	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	const shouldMangleSelectors = (): boolean => pluginConfig?.compiler?.mangleSelectors
		?? pluginConfig?.bundler?.compiler?.mangleSelectors
		?? (!pluginConfig.dev && !pluginConfig.bundler.watchFiles);

	return {
		name: pluginName,
		transformInclude(id) { return pluginConfig.transformIncludeFilter(id); },
		async transform(code) {
			if (pluginConfig.dev) {
				return code;
			}

			const bundler = getBundler();
			await bundler.waitOnBundlesProcessed();

			let transformCompiler = transformCompilers[pluginConfig.id] ?? null;

			if (transformCompiler === null) {
				transformCompiler = new Compiler({
					mangleSelectors: true,
					selectorsAreas: bundler.compilerConfig.selectorsAreas
				});

				transformCompilers[pluginConfig.id] = transformCompiler;
			}

			return {
				code: transformCompiler.rewriteSelectors(code),
				map: null
			};
		},
		esbuild: {
			async setup() {
				await waitForConfiguratinToLoad();
				await runBundler();
			}
		},
		rollup: {
			async options(): Promise<void> {
				await waitForConfiguratinToLoad();

				if (typeof pluginConfig.dev === 'boolean') {
					pluginConfig.bundler.compiler.mangleSelectors = shouldMangleSelectors();
				}

				pluginConfig.bundler.watchFiles = process.env.ROLLUP_WATCH === 'true';
				await runBundler();
			}
		},
		vite: {
			async configResolved(config): Promise<void> {
				await waitForConfiguratinToLoad();

				if (typeof pluginConfig.dev === 'undefined') {
					pluginConfig.dev = config.mode !== 'production';
				}

				if (pluginConfig.dev === true) {
					pluginConfig.bundler.watchFiles = pluginConfig?.bundler?.watchFiles ?? true;
				}

				pluginConfig.bundler.dev = pluginConfig.dev;
				pluginConfig.bundler.compiler.mangleSelectors = shouldMangleSelectors();

				await runBundler();
			}
		},
		webpack(compiler) {
			let configModified = false;

			const modifyConfig = async () => {
				if (configModified) {
					return;
				}

				await waitForConfiguratinToLoad();

				if (typeof pluginConfig.dev === 'undefined' && compiler.options.mode !== 'none') {
					pluginConfig.dev = compiler.options.mode === 'development';
					pluginConfig.bundler.dev = pluginConfig.dev;
				}

				pluginConfig.bundler.watchFiles = pluginConfig?.bundler?.watchFiles ?? compiler.options.watch;
				pluginConfig.bundler.compiler.mangleSelectors = shouldMangleSelectors();

				configModified = true;
			};

			compiler.hooks.beforeRun.tapPromise(pluginName, async (): Promise<void> => {
				await modifyConfig();
				await runBundler();
			});

			compiler.hooks.watchRun.tapPromise(pluginName, async (): Promise<void> => {
				await modifyConfig();
				await runBundler();
			});
		}
	};
});

export const stylifyVite = unplugin.vite;
export const stylifyRollup = unplugin.rollup;
export const stylifyWebpack = unplugin.webpack;
export const stylifyEsbuild = unplugin.esbuild;
