import fs from 'fs';
import banner from 'rollup-plugin-banner';
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from "@rollup/plugin-typescript";

"use strict";

const getTypescriptConfig = () => JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const devDirectories = ['esm', 'lib', 'types'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const createConfig = (config) => {
	const esVersion = config.esVersion || 'es6';
	const configs = [];
	const getPlugins = () => {
		const typescriptConfig = getTypescriptConfig();
		const plugins = [
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
				preventAssignment: true,
			}),
			typescript(typescriptConfig),
			babel({
				extensions: extensions,
				"presets": [
					["@babel/preset-env", {
						"bugfixes": true,
						"modules": false,
						"targets": esVersion === 'es5' ? "> 0.25%, not dead, not ie 11" : ">= 0.5% and supports es6-class"
					}]
				],
				include: ['src/**/*'],
				babelHelpers: 'bundled',
				"plugins": [
					"@babel/proposal-class-properties",
					"@babel/proposal-object-rest-spread"
				]
			}),
			nodeResolve({
				extensions: extensions,
			}),
		];

		plugins.push(
			banner('<%= pkg.name %> v<%= pkg.version %> \n(c) 2020-' + new Date().getFullYear() + ' <%= pkg.author %>\nReleased under the MIT License.')
		)

		return plugins;
	}

	const formats = config.output.format;

	formats.forEach((format) => {
		['.js'].forEach((suffix) => {
			const plugins = config.plugins || {};

			configs.push({
				input: config.input,
				external: config.external || [],
				output: {
					name: config.output.name,
					file: config.output.file + suffix,
					format: format,
					exports: format === 'umd' ? 'auto' : 'named',
				},
				plugins: getPlugins().concat(plugins)
			})
		})
	});

	return configs;
};

const createFileConfigs = (buildConfigs) => {
	let configs = [];

	buildConfigs.forEach((buildConfig) => {
		const outputFile = buildConfig.outputFile || buildConfig.inputFile;
		const inputFile = path.join(buildConfig.customPath || 'src', buildConfig.inputFile + '.ts');

		if (buildConfig.formats.includes('esm')) {
			configs = configs.concat(
				createConfig({
					input: inputFile,
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
	{inputFile: 'index', formats: ['esm', 'lib']},
	{inputFile: 'plugin', formats: ['esm', 'lib']},
	{inputFile: 'webpack-loader', formats: ['esm', 'lib']}
]);

export default configs;
