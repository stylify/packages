import 'v8-compile-cache';

import { build } from './Build';

const stylifyBrowserExternalDependencies = ['./SelectorsRewriter', './icons/style.css'];
build.addConfigs({
	packageName: 'stylify',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs'], minifyEsm: true},
		{
			inputFile: 'Stylify',
			formats: ['umd', 'esm'],
			external: [...stylifyBrowserExternalDependencies, ...['./Presets']],
			minifyEsm: true
		},
		{
			inputFile: 'stylify.native.browser',
			outputFile: 'stylify.native',
			formats: ['umd', 'esm'],
			external: stylifyBrowserExternalDependencies,
			minifyEsm: true
		}
	]
});

build.addConfigs({
	packageName: 'autoprefixer',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs']},
		{inputFile: 'Prefixer', outputFile: 'Prefixer/index', formats: ['esm', 'cjs'], external: [
			'@stylify/stylify',
			'.'
		]},
		{inputFile: 'PrefixesGenerator', outputFile: 'PrefixesGenerator/index', formats: ['esm', 'cjs'], external: [
			'@stylify/stylify',
			'postcss-js',
			'autoprefixer'
		]}
	]
});

build.addConfigs({
	packageName: 'nuxt-module',
	configs: [
		{inputFile: 'index', formats: ['esm', 'cjs'], external: ['@stylify/stylify', '@stylify/autoprefixer']},
		{inputFile: 'stylify-plugin', formats: ['esm', 'cjs'], external: ['@stylify/stylify', '@stylify/autoprefixer']},
		{inputFile: 'profiler-plugin', formats: ['esm', 'cjs'], external: ['@stylify/stylify']},
		{inputFile: 'webpack-loader', formats: ['esm', 'cjs'], external: [
			'@stylify/stylify',
			'@stylify/autoprefixer',
			'loader-utils'
		]}
	]
});

build.addConfigs({
	packageName: 'profiler',
	configs: [
		{inputFile: 'index', formats: ['esm'], external: ['@stylify/stylify']},
		{inputFile: 'Profiler.browser', outputFile: 'profiler', formats: ['umd'], external: ['@stylify/stylify']}
	]
});

export default build.getConfigs();
