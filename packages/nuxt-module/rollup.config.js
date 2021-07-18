// System
import fs from 'fs';

// Libraries
import banner from 'rollup-plugin-banner';
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from "@rollup/plugin-typescript";

"use strict";

const typescriptConfig = JSON.parse(fs.readFileSync('tsconfig.es6.json', 'utf8'));
const devDirectories = ['lib', 'tmp', 'types'];
const extensions = ['.js', '.ts'];
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
	const plugins = [
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
			preventAssignment: true,
		}),
		typescript(typescriptConfig),
		babel({
			extensions: extensions,
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
		banner('<%= pkg.name %> v<%= pkg.version %> \n(c) 2020-' + new Date().getFullYear() + ' <%= pkg.author %>\nReleased under the MIT License.')
	];

	const formats = config.output.format;
	formats.forEach((format) => {
		['.js'].forEach((suffix) => {

			configs.push({
				input: config.input,
				external: config.external || [],
				output: {
					name: config.output.name,
					file: config.output.file + suffix,
					format: format,
					exports: 'named'
				},
				plugins: plugins
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

		configs = configs.concat(
			createConfig({
				input: inputFile,
				output: {
					file: path.join('lib', outputFile),
					format: ['cjs']
				}
			})
		);
	});

	return configs;
};

const configs = [].concat(
	createFileConfigs([
  		{inputFile: 'index'},
		{inputFile: 'plugin'},
		{inputFile: 'webpack-loader'}
	])
);

export default configs;
