
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */

import path from 'path';
import { runBuild, bundleSync } from './helpers';

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

});
