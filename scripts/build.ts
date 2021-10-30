import 'v8-compile-cache';

import { argumentsProcessor } from './ArgumentsProcessor';
import { build } from './Build';
import fse from 'fs-extra';
import path from 'path';

const stylifyBrowserExternalDependencies = ['./Presets'];
build.addConfigs({
	packageName: 'stylify',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs'], minifyEsm: true},
		{
			inputFile: 'index',
			outputFile: 'stylify',
			formats: ['umd', 'esm'],
			external: stylifyBrowserExternalDependencies,
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
		{inputFile: 'index', formats: ['esm', 'cjs'], external: ['@stylify/stylify', '@stylify/autoprefixer']},
		{
			inputFile: 'runtime-plugin',
			formats: ['esm', 'cjs'],
			external: ['@stylify/stylify', '@stylify/autoprefixer']
		},
		{inputFile: 'profiler-plugin', formats: ['esm', 'cjs'], external: ['@stylify/stylify']},
		{inputFile: 'webpack-loader', formats: ['esm', 'cjs'], external: [
			'@stylify/stylify',
			'@stylify/autoprefixer',
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


let profilerAssetsBundlerInitialized = false;
const isWatchMode = argumentsProcessor.processArguments.isWatchMode;
const profilerInputDir = isWatchMode ? 'src' : path.join('tmp', 'src');
build.addConfigs({
	packageName: 'profiler',
	hooks: {
		buildStart: async (): Promise<void> => {
			if (profilerAssetsBundlerInitialized) {
				return;
			}

			profilerAssetsBundlerInitialized = true;

			const { Bundler } = await import(build.getPackageDir('bundler'));
			const { nativePreset } = await import(build.getPackageDir('stylify'));

			const bundler = new Bundler({
				compilerConfig: nativePreset.compiler,
				watchFiles: argumentsProcessor.processArguments.isWatchMode,
				verbose: false
			});

			const profilerPackageDir = build.getPackageDir('profiler');

			if (!isWatchMode) {
				fse.copySync(
					path.join(profilerPackageDir, 'src'),
					path.join(profilerPackageDir, 'tmp', 'src')
				);
			}

			bundler.bundle([
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
		}
	},
	configs: [
		{
			inputDir: profilerInputDir,
			inputFile: 'index',
			formats: ['esm'],
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
