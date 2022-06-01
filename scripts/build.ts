import 'v8-compile-cache';

import { argumentsProcessor } from './ArgumentsProcessor';
import { build } from './Build/index';
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
			formats: ['umd']
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
	packageName: 'bundler',
	configs: [
		{
			inputFile: 'index',
			formats: ['esm', 'cjs'],
			external: ['fast-glob'],
			nodeResolveEnabled: false,
			onlyEs6Version: true
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
			if (profilerBundler) {
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
				const srcTmpDir = path.join(profilerPackageDir, 'tmp', 'src');

				if (fse.existsSync(srcTmpDir)) {
					fse.rmdirSync(srcTmpDir, { recursive: true, force: true });
				}

				fse.copySync(path.join(profilerPackageDir, 'src'), srcTmpDir);
			}
			profilerBundler.bundle([
				{
					outputFile: path.join(
						profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', 'assets', 'profiler.css'
					),
					mangleSelectors: !isWatchMode,
					scope: '#stylify-profiler ',
					files: [
						path.join(profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', '*.tsx'),
						path.join(profilerPackageDir, isWatchMode ? '' : 'tmp', 'src', '**', '*.tsx')
					]
				}
			]);
		},
		buildStart: async (): Promise<void> => {
			return profilerBundler.waitOnBundlesProcessed() as Promise<void>;
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

build.addConfigs({
	packageName: 'nuxt-module',
	configs: [
		{inputFile: 'index', onlyEs6Version: true, formats: ['esm', 'cjs'], external: [
			'@stylify/bundler', '@stylify/stylify'
		]},
		{inputFile: 'profiler-plugin', onlyEs6Version: true, formats: ['esm', 'cjs'], external: [
			'@stylify/bundler', '@stylify/profiler'
		]},
		{inputFile: 'webpack-loader', onlyEs6Version: true, formats: ['esm', 'cjs'], external: [
			'@stylify/stylify',
			'loader-utils'
		]}
	]
});

build.addConfigs({
	packageName: 'unplugin',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs'], onlyEs6Version: true, external: [
			'@stylify/bundler',
			'@stylify/stylify',
			'unplugin'
		]}
	]
});

build.addConfigs({
	packageName: 'nuxt',
	configs: [
		{inputFile: 'module', formats: ['esm', 'cjs'], onlyEs6Version: true, external: [
			'@stylify/bundler', '@stylify/stylify', '@stylify/unplugin', '@nuxt/kit', '../package.json'
		]},
		{
			inputFile: 'runtime/plugins/profiler-plugin.client',
			outputFile: 'runtime/plugins/profiler-plugin.client.mjs',
			onlyEs6Version: true,
			withSuffix: false, formats: ['esm', 'cjs'],
			external: ['@stylify/bundler', '@stylify/profiler']
		}
	]
});

export const packageNamesToBuild = build.getPackageNamesToBuild();

export default build.getConfigs();
