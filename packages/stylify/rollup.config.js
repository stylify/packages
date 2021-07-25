import fs from 'fs';
import banner from 'rollup-plugin-banner';
import { terser } from "rollup-plugin-terser";
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssUrlPlugin from 'postcss-url';
import typescript from "@rollup/plugin-typescript";

"use strict";

const exportName = 'Stylify';

const getTypescriptConfig = () => JSON.parse(fs.readFileSync('tsconfig.es6.json', 'utf8'));
const devDirectories = ['dist', 'esm', 'lib', 'tmp', 'types'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const createConfig = (config) => {
	const esVersion = /* config.esVersion || */ 'es6';
	const configs = [];
	const getPlugins = (config) => {
		const typescriptConfig = getTypescriptConfig();
		typescriptConfig.exclude = [
			'./tests/**/*.ts'
		];
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
			babel({
				extensions: extensions,
				"presets": [
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
			}),
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

		plugins.push(
			banner('<%= pkg.name %> v<%= pkg.version %> \n(c) 2020-' + new Date().getFullYear() + ' <%= pkg.author %>\nReleased under the MIT License.')
		)

		return plugins;
	}

	const formats = config.output.format;

	formats.forEach((format) => {
		['.js', '.min.js'].forEach((suffix) => {
			const minify = config.output.minify || false;
			const plugins = config.plugins || {};

			if (suffix === '.min.js' && ! minify) {
				return;
			}

			configs.push({
				input: config.input,
				external: config.external || [],
				output: {
					name: config.output.name,
					file: config.output.file + suffix,
					format: format,
					exports: 'named',
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
					external: buildConfig.external || [],
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
					external: buildConfig.external || [],
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
					external: buildConfig.external || [],
					output: {
						file: path.join('esm', outputFile),
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
						file: path.join('lib', outputFile),
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
	// Indexes
	{inputFile: 'Compiler/index', formats: ['esm', 'lib'], external: [
		"./CompilationResult",
		"./CssRecord",
		"./MacroMatch",
		"./SelectorProperties",
		'./Compiler'
	]},
	{inputFile: 'Configurations/index', formats: ['esm', 'lib'], external: [
		'./NativeConfiguration'
	]},
	{inputFile: 'Profiler/index', formats: ['esm', 'lib'], external: [
		'./Toolbar',
		'./Extensions',
		'./Profiler'
	]},
	{inputFile: 'index', formats: ['esm', 'lib'], external: [
		'./Compiler',
		'./Configurations',
		'./EventsEmitter',
		'./Profiler',
		'./Runtime',
		'./SelectorsRewriter',
		'./Stylify',
	]},

	// Stylify
	{inputFile: 'Stylify', formats:['browser'], external: [
		'./Profiler',
		'./icons/style.css'
	]},
	{inputFile: 'Stylify', formats:['esm', 'lib'], external: [
		'./Compiler',
		'./EventsEmitter',
		'./Runtime'
	]},

	{inputFile: 'Compiler/Compiler', formats:['esm', 'lib']},
	{inputFile: 'Compiler/CompilationResult', formats:['esm', 'lib'], external: [
		'./CssRecord',
		'./MacroMatch',
		'./SelectorProperties'
	]},

	{inputFile: 'Compiler/MacroMatch', formats:['esm', 'lib']},
	{inputFile: 'Compiler/CssRecord', formats:['esm', 'lib']},
	{inputFile: 'Compiler/SelectorProperties', formats:['esm', 'lib']},

	{inputFile: 'Runtime', formats:['esm', 'lib'], external: [
		'./Compiler',
		'./Compiler/CompilationResult',
		'./EventsEmitter'
	]},

	{inputFile: 'SelectorsRewriter', formats:['esm', 'lib']},
	{inputFile: 'EventsEmitter', formats:['esm', 'lib']},
	{inputFile: 'Stylify.native.browser', outputFile: 'Stylify.native', formats:['browser'], external: [
		'./Profiler',
		'./icons/style.css'
	]},
	{inputFile: 'Configurations/NativeConfiguration', formats:['esm', 'lib']},

	// Profiler
	{inputFile: 'Profiler/Profiler', formats:['lib', 'esm']},
	{inputFile: 'Profiler.browser', formats:['browser']}
]);

export default configs;
