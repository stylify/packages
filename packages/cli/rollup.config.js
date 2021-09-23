import fs from 'fs';
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from "rollup-plugin-typescript2";

"use strict";

const getTypescriptConfig = () => JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const getBabelConfig = () => JSON.parse(fs.readFileSync('babel.config.json', 'utf8'));

const devDirectories = ['dist', 'esm', 'lib', 'types'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const createConfig = (config) => {
	const esVersion = config.esVersion || 'es6';
	const configs = [];
	const getPlugins = (config) => {
		const typescriptConfig = getTypescriptConfig();
		const babelConfig = getBabelConfig();
		babelConfig.extensions = extensions;
		babelConfig.babelHelpers = 'bundled';
		typescriptConfig.exclude = [
			'./tests/**/*.ts',
		];
		const plugins = [
			typescript(typescriptConfig),
			babel(babelConfig),
			nodeResolve({
				extensions: extensions,
			}),
		];

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
					file: config.output.file + (config.output.withSuffix ? suffix : ''),
					format: format,
					exports: format === 'umd' ? 'auto' : 'named',
				},
				plugins: getPlugins().concat(plugins)
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

		buildConfig.withSuffix = 'withSuffix' in buildConfig ? buildConfig.withSuffix : true;

		if (buildConfig.formats.includes('esm')) {
			configs = configs.concat(
				createConfig({
					input: inputFile,
					plugins: buildConfig.plugins || [],
					external: buildConfig.external || [],
					output: {
						file: path.join('dist', outputFile + '.module'),
						format: ['esm'],
						withSuffix: buildConfig.withSuffix
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
						format: ['cjs'],
						withSuffix: buildConfig.withSuffix
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
 	{inputFile: 'cli', outputFile: 'bin/stylify', formats: ['lib'], withSuffix: false},
	{inputFile: 'index', outputFile: 'index', formats: ['esm', 'lib']},
]);

export default configs;
