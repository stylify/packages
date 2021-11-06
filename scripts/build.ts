import 'v8-compile-cache';

import { argumentsProcessor } from './ArgumentsProcessor';
import { build } from './Build';
import fse from 'fs-extra';
import path from 'path';

build.addConfigs({
	packageName: 'stylify',
	configs: [
		{inputFile: 'index', outputFile: 'index', formats: ['esm', 'cjs'], minifyEsm: true},
		{
			inputFile: 'index',
			outputFile: 'stylify',
			formats: ['umd', 'esm'],
			external: ['./Presets'],
			minifyEsm: true
		},
		{
			inputFile: 'index.browser.native',
			outputFile: 'stylify.native',
			formats: ['umd', 'esm'],
			minifyEsm: true
		}
	]
});

build.addConfigs({
	packageName: 'autoprefixer',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs'], external: ['@stylify/stylify', 'postcss-js', 'autoprefixer']},
		{
			inputFile: 'Prefixer',
			outputFile: 'Prefixer/index',
			commonJsEnabled: false,
			formats: ['esm', 'cjs'],
			external: [
				'@stylify/stylify',
				'.'
			]
		},
		{
			inputFile: 'PrefixesGenerator',
			outputFile: 'PrefixesGenerator/index',
			commonJsEnabled: false,
			formats: ['esm', 'cjs'],
			external: [
				'@stylify/stylify',
				'postcss-js',
				'autoprefixer'
			]
		}
	]
});

build.addConfigs({
	packageName: 'nuxt-module',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs'], external: ['@stylify/stylify']},
		{inputFile: 'profiler-plugin', formats: ['esm', 'cjs'], external: ['@stylify/profiler']},
		{inputFile: 'webpack-loader', formats: ['esm', 'cjs'], external: [
			'@stylify/stylify',
			'loader-utils'
		]}
	]
});

build.addConfigs({
	packageName: 'bundler',
	configs: [
		{
			inputFile: 'index',
			formats: ['esm', 'cjs'],
			external: ['glob'],
			commonJsEnabled: false,
			nodeResolveEnabled: false
		}
	]
});

const isWatchMode = argumentsProcessor.processArguments.isWatchMode;
const profilerInputDir = isWatchMode ? 'src' : path.join('tmp', 'src');
let profilerBundler = null;

build.addConfigs({
	packageName: 'profiler',
	hooks: {
		options: async (): Promise<void> => {
			if (profilerBundler !== null) {
				return;
			}

			const { Bundler } = await import(build.getPackageDir('bundler'));
			const profilerBundlerConfigPath = path.join(build.getPackageDir('profiler'), 'stylify.config.js');

			profilerBundler = new Bundler({
				configFile: profilerBundlerConfigPath,
				watchFiles: isWatchMode,
				verbose: false
			});

			const profilerPackageDir = build.getPackageDir('profiler');

			if (!isWatchMode) {
				fse.rmdirSync(path.join(profilerPackageDir, 'tmp', 'src'), { recursive: true, force: true });
				fse.copySync(
					path.join(profilerPackageDir, 'src'),
					path.join(profilerPackageDir, 'tmp', 'src')
				);
			}
			profilerBundler.bundle([
				{
					outputFile: path.join(
						profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', 'assets', 'profiler.css'
					),
					mangleSelectors: !isWatchMode,
					scope: '#stylify-profiler',
					files: [
						path.join(profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', '*.tsx'),
						path.join(profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', '**', '*.tsx')
					]
				}
			]);
			await profilerBundler.waitOnBundlesProcessed();
		},
		watchChange: async (): Promise<void> => {
			await profilerBundler.waitOnBundlesProcessed();
		}
	},
	configs: [
		{
			inputDir: profilerInputDir,
			inputFile: 'index',
			formats: ['esm', 'cjs'],
			minifyEsm: true,
			external: ['@stylify/stylify']
		},
		{
			inputDir: profilerInputDir,
			inputFile: 'index.browser',
			outputFile: 'profiler',
			formats: ['umd'],
			external: ['@stylify/stylify']
		}
	]
});

export default build.getConfigs();
