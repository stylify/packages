
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */

import path from 'path';
import { runBuild, bundle, bundleSync } from './helpers';

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
				entryPoints: [path.join('src', 'index.browser')],
				outfile: 'stylify',
				platform: 'browser',
				formats: 'iife'
			},
			{
				entryPoints: [path.join('src', 'index.browser.native')],
				outfile: 'stylify.native',
				platform: 'browser',
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

	await bundle({
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
	});

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
				entryPoints: [path.join('src', 'webpack-loader')],
				outfile: 'webpack-loader',
				external: ['@stylify/stylify', 'loader-utils'],
				formats: ['esm', 'cjs']
			}
		]
	});

});
