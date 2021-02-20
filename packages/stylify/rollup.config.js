// System
import fs from 'fs';

// Libraries
import banner from 'rollup-plugin-banner';
import { terser } from "rollup-plugin-terser";
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssUrlPlugin from 'postcss-url';

"use strict";

const exportName = 'Stylify';

const typescriptConfig = JSON.parse(fs.readFileSync('tsconfig.es6.json', 'utf8'));
const devDirectories = ['dist', 'es5', 'lib', 'tmp'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
devDirectories.forEach(directory => {
	try {
		if (fs.existsSync(directory)) {
			fs.rmdirSync(directory, { recursive: true });
		}
		console.log(`${directory} is deleted!`);

	} catch (err) {
		console.error(`Error while deleting ${directory}.`);
	}

	fs.mkdirSync(directory);
});

const createConfig = (config) => {
	const esVersion = /* config.esVersion || */ 'es6';
	const configs = [];
	const getPlugins = (config) => {
		const plugins = [
			nodeResolve({
				extensions: extensions,
			}),
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			babel({
				extensions: extensions,
				"presets": [
					"@babel/typescript",
					[
						"@babel/env",
						{
							"bugfixes": true,
							"modules": false,
							"targets": {
								"chrome": "80",
							}
						},
					],
					["@babel/preset-react", {
						"pragma": "h"
					}]
				],
				include: ['src/**/*'],
				babelHelpers: 'bundled',
				"plugins": [
					"@babel/proposal-class-properties",
					"@babel/proposal-object-rest-spread",
					["@babel/plugin-transform-react-jsx", {
						"runtime": "automatic",
						"importSource": "preact",
					}]
				]
			})
		];

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
		['.js'/* , '.min.js' */].forEach((suffix) => {
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
					terser: suffix === '.min.js',
					babel: suffix === 'es5',
				}).concat(plugins)
			})
		})
	});

	return configs;
};

const convertCamelCaseIntoDashCase = (content) => {
	return content.replace(/[A-Z]/g, m => "-" + m.toLowerCase()).replace(/^-{1}/, '');
};

const createFileConfigs = (buildConfigs) => {
	let configs = [];

	buildConfigs.forEach((buildConfig) => {
		const outputFile = buildConfig.outputFile || buildConfig.inputFile;
		const inputFile = path.join(buildConfig.customPath || 'src', buildConfig.inputFile + '.ts');

		if (buildConfig.formats.includes('browser')) {
			const outputPath = path.join('dist', convertCamelCaseIntoDashCase(outputFile));

			configs = configs.concat(
 				createConfig({
					input: inputFile,
					esVersion: 'es5',
					plugins: buildConfig.plugins || [],
					output: {
						name: exportName,
						file: outputPath + '.es5',
						format: ['umd'],
						minify: true
					}
				}),
				createConfig({
					input: inputFile,
					plugins: buildConfig.plugins || [],
					output: {
						name: exportName,
						file: outputPath,
						format: ['umd'],
						minify: true
					}
				}),
			);
		}

		if (buildConfig.formats.includes('esm')) {
			configs = configs.concat(
				createConfig({
					input: inputFile,
					esVersion: 'es5',
					plugins: buildConfig.plugins || [],
					output: {
						file: path.join('es5', outputFile),
						format: ['esm']
					}
				})
			)
		}

		if (buildConfig.formats.includes('lib')) {
			configs = configs.concat(
				createConfig({
					input: inputFile,
					plugins: buildConfig.plugins || [],
					output: {
						file: path.join('lib', outputFile),
						format: ['esm']
					}
				})
			);
		}
	});

	return configs;
};

const configs = [].concat(
	createFileConfigs([
		// Configs
		{inputFile: 'Configurations/NativeConfiguration', formats:['esm', 'lib']},
		// Parts
 		{inputFile: 'Compiler', formats:['esm', 'lib']},
		{inputFile: 'SelectorsRewriter', formats:['esm', 'lib']},
		{inputFile: 'index', formats:['esm', 'lib']},
		// Stylify for browser
  		{inputFile: 'Stylify', formats:['browser', 'esm']},
		{inputFile: 'Stylify.native.browser', outputFile: 'Stylify.native', formats:['browser', 'esm']},
		// Profiler
 		{inputFile: 'Profiler', formats:['browser', 'esm'], plugins: [
			 postcss({
				plugins: [
					postcssUrlPlugin({
						url: 'inline'
					})
				]
			})
		 ]},
	])
);

export default configs;
