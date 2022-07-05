
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */

import fse from 'fs-extra';
import path from 'path';
import { BundleConfigInterface, BundlerConfigInterface } from '../packages/bundler/src';
import { getPackageDir, runBuild, bundle, bundleSync, isWatchMode } from './helpers';

const profilerInputDir = isWatchMode ? 'src' : path.join('tmp', 'src');

runBuild(async () => {

	await bundleSync({
		package: 'stylify',
		bundles: [
			{
				entryPoints: [path.join('src', 'index')],
				outfile: 'index',
				formats: ['esm', 'esm-browser', 'cjs']
			},
			{
				entryPoints: [path.join('src', 'index')],
				outfile: 'stylify',
				formats: 'iife',
				external: ['./Presets']
			},
			{
				entryPoints: [path.join('src', 'index.browser.native')],
				outfile: 'stylify.native',
				formats: 'iife'
			}
		]
	});

	await bundleSync({
		package: 'autoprefixer',
		bundles: [
			{
				entryPoints: [path.join('src', 'index')],
				external: ['@stylify/stylify', 'postcss-js', 'autoprefixer'],
				outfile: 'index',
				formats: ['esm', 'cjs']
			},
			{
				entryPoints: [path.join('src', 'Prefixer')],
				bundle: false,
				outfile: 'prefixer',
				formats: ['esm', 'cjs', 'iife']
			}
		]
	});

	await bundleSync({
		package: 'bundler',
		bundles: [
			{
				entryPoints: [path.join('src', 'index')],
				outfile: 'index',
				platform: 'node',
				external: ['@stylify/stylify', 'fast-glob', 'normalize-path'],
				formats: ['esm', 'cjs']
			}
		]
	});

	await Promise.all([
		bundle({
			package: 'unplugin',
			bundles: [
				{
					entryPoints: [path.join('src', 'index')],
					outfile: 'index',
					platform: 'node',
					external: ['@stylify/bundler', '@stylify/stylify', 'unplugin'],
					formats: ['esm', 'cjs']
				}
			]
		}),

		bundle({
			package: 'profiler',
			beforeBundle: async () => {
				const { Bundler } = await import(getPackageDir('bundler'));
				const profilerPackageDir = getPackageDir('profiler');
				const profilerBundlerConfigPath = path.join(getPackageDir('profiler'), 'stylify.config.js');

				const bundlerConfig: BundlerConfigInterface = {
					configFile: profilerBundlerConfigPath,
					watchFiles: isWatchMode,
					verbose: false
				};

				const profilerBundler = new Bundler(bundlerConfig);

				if (!isWatchMode) {
					const srcTmpDir = path.join(profilerPackageDir, 'tmp', 'src');

					if (fse.existsSync(srcTmpDir)) {
						fse.rmdirSync(srcTmpDir, { recursive: true, force: true });
					}

					fse.copySync(path.join(profilerPackageDir, 'src'), srcTmpDir);
				}

				const bundleConfig: BundleConfigInterface = {
					outputFile: path.join(
						profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', 'assets', 'profiler.css'
					),
					compiler: {
						mangleSelectors: !isWatchMode
					},
					scope: '#stylify-profiler ',
					files: [
						path.join(profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', '*.tsx'),
						path.join(profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', '**', '*.tsx')
					]
				};
				await profilerBundler.bundle([bundleConfig]);

				await profilerBundler.waitOnBundlesProcessed();
			},
			bundles: [
				{
					entryPoints: [path.join(profilerInputDir, 'index')],
					outfile: 'index',
					formats: ['esm', 'esm-browser', 'cjs'],
					external: ['@stylify/stylify']
				},
				{
					entryPoints: [path.join(profilerInputDir, 'index.browser')],
					outfile: 'profiler',
					formats: ['iife'],
					external: ['@stylify/stylify']
				}
			]
		})
	]);

	bundle({
		package: 'nuxt',
		bundles: [
			{
				entryPoints: [path.join('src', 'module')],
				outfile: 'module',
				platform: 'node',
				minify: false,
				external: ['@stylify/bundler', '@stylify/stylify', '@stylify/unplugin', '@nuxt/kit'],
				formats: ['esm', 'cjs']
			},
			{
				entryPoints: [path.join('src', 'runtime', 'plugins', 'profiler-plugin.client')],
				outfile: path.join('runtime', 'plugins', 'profiler-plugin.client'),
				platform: 'browser',
				minify: false,
				external: ['@stylify/bundler', '@stylify/stylify', '@stylify/unplugin', '@nuxt/kit'],
				formats: ['esm', 'esm-lib']
			}
		]
	});

	bundle({
		package: 'nuxt-module',
		bundles: [
			{
				entryPoints: [path.join('src', 'index')],
				outfile: 'index',
				platform: 'node',
				external: ['@stylify/bundler', '@stylify/stylify'],
				formats: ['esm', 'cjs']
			},
			{
				entryPoints: [path.join('src', 'profiler-plugin')],
				outfile: 'profiler-plugin',
				platform: 'node',
				external: ['@stylify/bundler', '@stylify/profiler'],
				formats: ['esm', 'cjs']
			},
			{
				entryPoints: [path.join('src', 'webpack-loader')],
				outfile: 'webpack-loader',
				external: ['@stylify/stylify', 'loader-utils'],
				formats: ['esm', 'cjs']
			}
		]
	});

});
