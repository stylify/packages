import { BundleConfigInterface, BundlerConfigInterface, Bundler, hooks as bundlerHooks } from '@stylify/bundler';
import {
	Configurator,
	DefaultConfigInterface,
	mergeObjects
} from '@stylify/stylify';
import process from 'process';
import type { Plugin as VitePlugin } from 'vite';
import type { WebpackPluginInstance } from 'webpack';
import type { Plugin as RollupPlugin } from 'rollup';
import type { Plugin as EsbuildPlugin } from 'esbuild';
import { UnpluginFactoryOutput, createUnplugin } from 'unplugin';

export interface UnpluginConfigInterface extends DefaultConfigInterface {
	id?: string,
	configFile?: string|string[],
	bundles?: BundleConfigInterface[];
	dev?: boolean;
	bundler?: BundlerConfigInterface;
}

export const hooks = bundlerHooks;
export const defineConfig = (config: UnpluginConfigInterface): UnpluginConfigInterface => config;

const bundlers: Record<string, Bundler> = {};

export const unplugin = createUnplugin((config: UnpluginConfigInterface = {}) => {
	const pluginName = 'stylify';
	let pluginConfig: UnpluginConfigInterface = {};
	let configured = false;
	let initialRunExecuted = false;
	let configurationLoadingPromise: Promise<void> | null = null;

	const waitForConfiguratinToLoad = async (): Promise<void> => {
		if (configurationLoadingPromise !== null) {
			await configurationLoadingPromise;
		}
	};

	const configure = (): void => {
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

		if (typeof config.configFile !== 'undefined' && !Array.isArray(config.configFile)) {
			config.configFile = [config.configFile];
		}

		pluginConfig = mergeObjects(
			{
				id: 'default',
				bundles: [],
				bundler: {
					compiler: {}
				}
			},
			config,
			{
				configFile: Object.values(Configurator.getExistingConfigFiles(process.cwd()))
			}
		);

		pluginConfigured();
	};

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	configure();

	const getBundler = (): Bundler => {
		if (typeof pluginConfig.dev === 'undefined' && typeof process.env['NODE_ENV'] !== 'undefined') {
			pluginConfig.dev = process.env['NODE_ENV'] !== 'test';
			pluginConfig.bundler.dev = pluginConfig?.bundler?.dev ?? pluginConfig.dev;
		}

		let bundler = bundlers[pluginConfig.id] ?? null;

		if (!bundler) {
			const bundlerConfig = mergeObjects(
				{
					compiler: pluginConfig.compiler ?? {},
					bundles: pluginConfig.bundles,
					configFile: pluginConfig.configFile,
					verbose: pluginConfig.bundler.verbose ?? pluginConfig.dev
				},
				pluginConfig.bundler
			);

			bundler = new Bundler(bundlerConfig);
			bundlers[pluginConfig.id] = bundler;
		}

		return bundler;
	};

	const runBundler = async () => {
		if (initialRunExecuted) {
			return;
		}

		initialRunExecuted = true;
		const bundlerRunner = getBundler();

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		bundlerRunner.bundle();
		await bundlerRunner.waitOnBundlesProcessed();
	};

	return {
		name: pluginName,
		esbuild: {
			async setup() {
				await waitForConfiguratinToLoad();
				await runBundler();
			}
		},
		rollup: {
			async options() {
				await waitForConfiguratinToLoad();
				pluginConfig.bundler.watchFiles = process.env.ROLLUP_WATCH === 'true';

				await runBundler();
			}
		},
		vite: {
			async configResolved(config) {
				await waitForConfiguratinToLoad();

				if (typeof pluginConfig.dev === 'undefined') {
					pluginConfig.dev = config.mode !== 'production';
				}

				if (pluginConfig.dev === true) {
					pluginConfig.bundler.watchFiles = pluginConfig?.bundler?.watchFiles ?? true;
				}

				pluginConfig.bundler.dev = pluginConfig.dev;
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
				configModified = true;
			};

			compiler.hooks.beforeRun.tapPromise(pluginName, async () => {
				await modifyConfig();
				await runBundler();
			});

			compiler.hooks.watchRun.tapPromise(pluginName, async () => {
				await modifyConfig();
				await runBundler();
			});
		}
	};
});

export const stylifyVite = unplugin.vite as unknown as UnpluginFactoryOutput<UnpluginConfigInterface, VitePlugin>;
export const stylifyRollup = unplugin.rollup as unknown as UnpluginFactoryOutput<UnpluginConfigInterface, RollupPlugin>;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
export const stylifyWebpack = unplugin.webpack as UnpluginFactoryOutput<UnpluginConfigInterface, WebpackPluginInstance>;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
export const stylifyEsbuild = unplugin.esbuild as UnpluginFactoryOutput<UnpluginConfigInterface, EsbuildPlugin>;
