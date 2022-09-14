import { BundleConfigInterface, BundlerConfigInterface, Bundler, BundlesBuildCacheInterface } from '@stylify/bundler';
import {
	CompilationResult,
	Compiler,
	ComponentsInterface,
	Configurator,
	DefaultConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import { createUnplugin } from 'unplugin';

export interface UnpluginConfigInterface extends DefaultConfigInterface {
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

export const unplugin = createUnplugin((config: UnpluginConfigInterface) => {

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

		const pluginCustomConfig: UnpluginConfigInterface[] = Array.isArray(config) ? config : [config];
		const configurator = new Configurator();

		pluginConfig = await configurator.processConfigs([
			{
				dev: null,
				bundles: [],
				bundler: {
					compiler: {}
				},
				transformIncludeFilter: (id: string) =>
					defaultAllowedTypesRegExp.test(id) && !defaultIgnoredDirectoriesRegExp.test(id)
			},
			...pluginCustomConfig
		]);

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

	const runBundlerOrWait = async () => {
		if (bundler) {
			return bundler.waitOnBundlesProcessed();
		}

		const localBundler = getBundler();

		await Promise.all([
			localBundler.bundle(),
			localBundler.waitOnBundlesProcessed()
		]);
	};

	return {
		name: pluginName,
		transformInclude(id) { return pluginConfig.transformIncludeFilter(id); },
		async transform(code): Promise<string> {
			const bundler = getBundler();
			await bundler.bundle();
			await bundler.waitOnBundlesProcessed();

			if (pluginConfig.dev) {
				return code;
			}

			const selectors = {};
			const components: Record<string, ComponentsInterface> = {};

			const bundlesBuildCache: BundlesBuildCacheInterface[] = Object.values(bundler.bundlesBuildCache);
			for (const bundleBuildCache of bundlesBuildCache) {
				for (const selector in bundleBuildCache.compilationResult.selectorsList) {
					if (!(selector in selectors)) {
						selectors[selector] = {selector: selector};
					}
				}

				for (const component in bundleBuildCache.compiler.components) {
					if (!(component in components)) {
						components[component] = bundleBuildCache.compiler.components[component];
					}
				}
			}

			return new Compiler(bundler.compilerConfig).rewriteSelectors(
				code,
				new CompilationResult({
					selectorsList: selectors,
					componentsList: Object.keys(components)
				})
			);
		},
		esbuild: {
			async setup() {
				await waitForConfiguratinToLoad();
				await runBundlerOrWait();
			}
		},
		rollup: {
			async options(): Promise<void> {
				await waitForConfiguratinToLoad();

				if (pluginConfig.dev !== null) {
					pluginConfig.bundler.compiler.mangleSelectors = !pluginConfig.dev;
				}

				pluginConfig.bundler.watchFiles = process.env.ROLLUP_WATCH === 'true';
				return runBundlerOrWait();
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

				return runBundlerOrWait();
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
				return runBundlerOrWait();
			});

			compiler.hooks.watchRun.tapPromise(pluginName, async (): Promise<void> => {
				await modifyConfig();
				return runBundlerOrWait();
			});
		}
	};
});

export const vitePlugin = unplugin.vite;
export const rollupPlugin = unplugin.rollup;
export const webpackPlugin = unplugin.webpack;
export const esbuildPlugin = unplugin.esbuild;
