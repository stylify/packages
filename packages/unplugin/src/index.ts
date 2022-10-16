import { BundleConfigInterface, BundlerConfigInterface, Bundler } from '@stylify/bundler';
import {
	Compiler,
	Configurator,
	DefaultConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import { createUnplugin } from 'unplugin';

export interface UnpluginConfigInterface extends DefaultConfigInterface {
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
let transformCompiler: Compiler = null;

export const unplugin = createUnplugin((config: UnpluginConfigInterface|UnpluginConfigInterface[]) => {

	const pluginName = 'stylify';
	let pluginConfig: UnpluginConfigInterface = {};
	let bundler: Bundler = null;
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

		const pluginCustomConfig: UnpluginConfigInterface = mergeObjects(
			...Array.isArray(config) ? config : [config]
		);

		const configsToProcess: (UnpluginConfigInterface|string)[] = [
			{
				dev: null,
				bundles: [],
				bundler: {
					compiler: {}
				},
				transformIncludeFilter: (id: string) =>
					defaultAllowedTypesRegExp.test(id) && !defaultIgnoredDirectoriesRegExp.test(id)
			},
			pluginCustomConfig
		];

		if (pluginCustomConfig.configFile) {
			configsToProcess.push(pluginCustomConfig.configFile);
			delete pluginCustomConfig.configFile;
		}

		const configurator = new Configurator();

		pluginConfig = await configurator.processConfigs(configsToProcess);

		pluginConfigured();
	};

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	configure();

	const getBundler = (): Bundler => {
		if (pluginConfig.dev === null && typeof process.env['NODE_ENV'] !== 'undefined') {
			pluginConfig.dev = process.env['NODE_ENV'] !== 'test';
			pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev;
		}

		if (pluginConfig.dev || !bundler) {
			bundler = new Bundler(mergeObjects(
				{
					compiler: pluginConfig.compiler ?? {},
					bundles: pluginConfig.bundles
				},
				pluginConfig.bundler
			) as BundleConfigInterface);
		}

		return bundler;
	};

	const runBundler = async () => {
		if (bundler) {
			await bundler.waitOnBundlesProcessed();
		}

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		getBundler().bundle();
		await bundler.waitOnBundlesProcessed();
	};

	return {
		name: pluginName,
		transformInclude(id) { return pluginConfig.transformIncludeFilter(id); },
		async transform(code): Promise<string> {
			if (pluginConfig.dev) {
				return code;
			}

			const bundler = getBundler();
			await bundler.waitOnBundlesProcessed();

			if (transformCompiler === null) {
				transformCompiler = new Compiler;
			}

			return transformCompiler.rewriteSelectors(code);
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

				if (pluginConfig.dev !== null) {
					pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev;
				}

				pluginConfig.bundler.watchFiles = process.env.ROLLUP_WATCH === 'true';
				await runBundler();
			}
		},
		vite: {
			async configResolved(config): Promise<void> {
				await waitForConfiguratinToLoad();

				if (pluginConfig.dev === null) {
					pluginConfig.dev = !config.isProduction;
					pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev;
					pluginConfig.bundler.watchFiles = pluginConfig.dev;
				} else if (pluginConfig.dev === true) {
					pluginConfig.bundler.watchFiles = true;
				}

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

				if (pluginConfig.dev === null && compiler.options.mode !== 'none') {
					pluginConfig.dev = compiler.options.mode === 'development';
				}

				pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev && !compiler.options.watch;
				pluginConfig.bundler.watchFiles = compiler.options.watch;

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
