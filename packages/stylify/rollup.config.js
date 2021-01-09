// System
import fs from 'fs';

// Libraries
import banner from 'rollup-plugin-banner';
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import cssNano from 'cssnano';

"use strict";

const exportName = 'Stylify';
const umdInputFile = path.join('src', 'Stylify.browser.ts');
const umdOutputFile = path.join('dist', 'stylify');
const umdEs5OutputFile = path.join('dist', 'stylify.es5');
const esmInputFile = path.join('src', 'Stylify.ts');
const esmOutputFile = path.join('lib', 'Stylify');
const esmEs5OutputFile = path.join('es5', 'Stylify');
// Native macros
const nativeMacrosUmdInputFile = path.join('src', 'Stylify.browser.native.ts');
const nativeMacrosUmdOutputFile = path.join('dist', 'stylify.native');
const nativeMacrosUmdEs5OutputFile = path.join('dist', 'stylify.native.es5');
const nativeMacrosEsmInputFile = path.join('src', 'Stylify.native.ts');
const nativeMacrosEsmOutputFile = path.join('lib', 'Stylify.native');
const nativeMacrosEsmEs5OutputFile = path.join('es5', 'Stylify.native');
// Tests
const testInputFile = path.join('tests', 'test-stack.ts');
const testOutputFile = path.join('tests', 'test-stack');

const profilerExportName = 'Profiler';
const profilerUmdInputFile = path.join('src', 'Profiler.ts');
const profilerUmdOutputFile = path.join('dist', 'profiler');
const profilerUmdEs5OutputFile = path.join('dist', 'profiler.es5');
const profilerEsmInputFile = path.join('src', 'Profiler.ts');
const profilerEsmOutputFile = path.join('lib', 'Profiler');
const profilerEsmEs5OutputFile = path.join('es5', 'Profiler');
const profilerTestInputFile = path.join('tests', 'profiler', 'test-stack.ts');
const profilerTestOutputFile = path.join('tests', 'test-stack');

const typescriptConfig = JSON.parse(fs.readFileSync('tsconfig.es6.json', 'utf8'));


/* const cssNanoOpts = {
	preset: 'default',
};
let cssLoaded = false;
let normalizeCss = fs.readFileSync('./node_modules/normalize.css/normalize.css', 'utf8');
cssNano.process(normalizeCss, {}, cssNanoOpts).then(result => {
	console.log(result.css);
	normalizeCss = result.css;
	cssLoaded = true;
}); */
/*
while(true) {
	console.log(cssLoaded);
	if (cssLoaded === true) {
		break;
	}
} */

const createConfig = (config) => {
	const esVersion = /* config.esVersion || */ 'es6';
	const configs = [];
	const getPlugins = (config) => {
		const plugins = [
			nodeResolve(),
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			/* replace({
				__NORMALIZE_CSS__: normalizeCss,
			}), */
		];

		plugins.push(typescript(typescriptConfig));

		plugins.push(postcss());


 		babel({
			babelHelpers: 'bundled'
		});

 		if (config.terser) {
			plugins.push(
				terser({
					output: {
						comments: false
					}
				})
			);
		}

		plugins.push(
			banner('Stylify.js v<%= pkg.version %> \n(c) 2020-' + new Date().getFullYear() + ' <%= pkg.author %>\nReleased under the MIT License.')
		)

		return plugins;
	}

	config.output.format.forEach((format) => {
		['.js', '.min.js'].forEach((suffix) => {
			const minify = config.output.minify || false;
			const plugins = config.plugins || {};

			if (suffix === '.min.js' && ! minify) {
				return;
			}

			configs.push({
				input: config.input,
				output: {
					name: config.output.name,
					file: config.output.file + suffix,
					format: format
				},
				plugins: getPlugins({
					terser: suffix === '.min.js'
				})
			})
		})
	});

	return configs;
};

export default [].concat(
/*  	createConfig({
		input: umdInputFile,
		esVersion: 'es5',
		output: {
			name: exportName,
			file: umdEs5OutputFile,
			format: ['umd'],
			minify: true
		}
	}), */
/*   	createConfig({
		input: umdInputFile,
		output: {
			name: exportName,
			file: umdOutputFile,
			format: ['umd'],
			minify: true
		}
	}), */
	createConfig({
		input: nativeMacrosUmdInputFile,
		output: {
			name: exportName,
			file: nativeMacrosUmdOutputFile,
			format: ['umd'],
			minify: true
		}
	}),
	createConfig({
		input: profilerUmdInputFile,
		output: {
			name: profilerExportName,
			file: profilerUmdOutputFile,
			format: ['umd'],
			minify: true
		},
	}),
	/*createConfig({
		input: esmInputFile,
		esVersion: 'es5',
		output: {
			file: esmEs5OutputFile,
			format: ['esm']
		}
	}),
	createConfig({
		input: esmInputFile,
		output: {
			file: esmOutputFile,
			format: ['esm']
		}
	}) */
);
