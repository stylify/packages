
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
				formats: ['esm', 'cjs']
			},
			{
				entryPoints: [path.join('src', 'index.browser')],
				outfile: 'index',
				platform: 'browser',
				formats: 'esm-browser'
			},
			{
				entryPoints: [path.join('src', 'index.browser.iife')],
				outfile: 'stylify',
				platform: 'browser',
				formats: 'iife'
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
				external: [
					'@stylify/stylify',
					'fast-glob',
					'chokidar',
					'micromatch',
					'normalize-path',
					'postcss',
					'autoprefixer'
				],
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
				external: [
					'@stylify/bundler',
					'@stylify/stylify',
					'esbuild',
					'unplugin',
					'vite',
					'webpack',
					'rollup'
				],
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

	bundle({
		package: 'astro',
		bundles: [
			{
				entryPoints: [path.join('src', 'index')],
				outfile: 'index',
				platform: 'node',
				minify: false,
				external: ['@stylify/stylify', '@stylify/unplugin'],
				formats: ['esm', 'cjs']
			}
		]
	});

});
