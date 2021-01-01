// System
import fs from 'fs';

// Libraries
import banner from 'rollup-plugin-banner';
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import cssNano from 'cssnano';

"use strict";

const exportName = 'Stylify';
const umdInputFile = 'src/Stylify.ts';
const umdOutputFile = 'dist/stylify';
const umdEs5OutputFile = 'dist/stylify.es5';
const esmInputFile = 'src/Stylify.ts';
const esmOutputFile = 'lib/Stylify';
const esmEs5OutputFile = 'es5/Stylify';
const testInputFile = 'tests/test-stack.ts'
const testOutputFile = 'tests/test-stack';

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
	const getPlugins = (minify) => {
		const plugins = [
			/* replace({
				__NORMALIZE_CSS__: normalizeCss,
			}), */
			nodeResolve(),
			postcss(),
			typescript(typescriptConfig),
		];

		babel({
			babelHelpers: 'bundled'
		});

		if (minify) {
			plugins.push(terser());
		}

		plugins.push(
			banner('Stylify.js v<%= pkg.version %> \n(c) 2020-' + new Date().getFullYear() + ' <%= pkg.author %>\nReleased under the MIT License.')
		)

		return plugins;
	}

	config.output.format.forEach((format) => {
		['.js', '.min.js'].forEach((suffix) => {
			const minify = config.output.minify || false;
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
				plugins: getPlugins(suffix === '.min.js')
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
  	createConfig({
		input: umdInputFile,
		output: {
			name: exportName,
			file: umdOutputFile,
			format: ['umd'],
			minify: true
		}
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
