import fs from 'fs';
import banner from 'rollup-plugin-banner';
import { terser } from "rollup-plugin-terser";
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssUrlPlugin from 'postcss-url';
import typescript from "rollup-plugin-typescript2";

"use strict";

const isDevMode = process.env.ROLLUP_WATCH;

const exportName = 'Stylify';

const getTypescriptConfig = () => JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const getBabelConfig = () => JSON.parse(fs.readFileSync('babel.config.json', 'utf8'));

const devDirectories = ['dist', 'types'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const createConfig = (config) => {
	const esVersion = config.esVersion || 'es6';
	const configs = [];
	const getPlugins = (config) => {
		const typescriptConfig = getTypescriptConfig();
		const babelConfig = getBabelConfig();
		babelConfig.presets.push([
			"@babel/preset-env", {
				"bugfixes": true,
				"modules": false,
				"targets": esVersion === "es5" ? "> 0.25%, not dead, not ie 11" : ">= 0.5% and supports es6-class"
			}
		]);
		babelConfig.extensions = extensions;
		babelConfig.babelHelpers = 'bundled';
		const plugins = [
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
				preventAssignment: true,
			}),
			typescript(typescriptConfig),
			postcss({
				plugins: [
					postcssUrlPlugin({
						url: 'inline'
					})
				]
			}),
			babel(babelConfig),
			nodeResolve({
				extensions: extensions,
			}),
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

		if (!isDevMode) {
			plugins.push(
				banner('<%= pkg.name %> v<%= pkg.version %> \n(c) 2020-' + new Date().getFullYear() + ' <%= pkg.author %>\nReleased under the MIT License.')
			)
		}

		return plugins;
	}

	const formats = config.output.format;

	formats.forEach((format) => {
		['.js', '.min.js'].forEach((suffix) => {
			const minify = config.output.minify || false;
			const plugins = config.plugins || {};

			if (suffix === '.min.js' && (!minify || isDevMode)) {
				return;
			}

			configs.push({
				input: config.input,
				external: config.external || [],
				output: {
					name: config.output.name,
					file: config.output.file + suffix,
					format: format,
					exports: format === 'umd' ? 'auto' : 'named',
				},
				plugins: getPlugins({
					terser: suffix === '.min.js'
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
					plugins: buildConfig.plugins || [],
					external: buildConfig.external || [],
					output: {
						name: exportName,
						file: outputPath,
						format: ['umd'],
						minify: true
					}
				}),
			);

			if (!isDevMode) {
				configs = configs.concat(
					createConfig({
						input: inputFile,
						esVersion: 'es5',
						plugins: buildConfig.plugins || [],
						external: buildConfig.external || [],
						output: {
							name: exportName,
							file: outputPath + '.es5',
							format: ['umd'],
							minify: true
						}
					})
				);
			}
		}

		if (buildConfig.formats.includes('esm')) {
			configs = configs.concat(
				createConfig({
					input: inputFile,
					plugins: buildConfig.plugins || [],
					external: buildConfig.external || [],
					output: {
						file: path.join('dist', outputFile + '.module'),
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
					external: buildConfig.external,
					output: {
						file: path.join('dist', outputFile),
						format: ['cjs']
					}
				})
			);
		}
	});

	return configs;
};

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

const configs = createFileConfigs([
  	{inputFile: 'index', formats: ['esm', 'lib'], external: ['@stylify/stylify']},
 	{inputFile: 'Profiler.browser', outputFile: 'profiler', formats:['browser'], external: ['@stylify/stylify']}
]);

export default configs;
