
import fs from 'fs';
import { terser } from 'rollup-plugin-terser';
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import postcssUrlPlugin from 'postcss-url';
import typescript from 'rollup-plugin-typescript2';
import packageJson from '../../package.json';
import lernaJson from '../../lerna.json';
import { argumentsProcessor } from '../ArgumentsProcessor';
import { buildPlugin, RollupHooksListInterface } from './buildPlugin';
import { typesPlugin } from './typesPlugin';

export interface BuildConfigConfigurationInterface {
	packageName: string,
	inputDir: string
	inputFile: string,
	outputFile: string,
	outputDir: string,
	formats: string[],
	external: string[],
	typescriptExclude: string[][] | string[],
	withSuffix: boolean,
	plugins: [],
	minifyEsm: false | boolean,
	bannerContent: string,
	commonJsEnabled: true | boolean,
	nodeResolveEnabled: true | boolean,
	hooks: RollupHooksListInterface
}

class BuildConfig {

	private exportName = 'Stylify';

	private isDevMode = argumentsProcessor.processArguments.isDevMode

	private buildFilesExtensions = ['.js', '.ts', 'tsx'];

	private bannerContent = `
/**
*	${packageJson.name} v${lernaJson.version}
*	(c) 2021-present ${packageJson.author}
*	Released under the MIT License.
*/
	`.trim() + '\n';

	private babelOldBrowsersTarget = '>= 0.1%, not dead, not ie 11';

	private babelModernBrowsersTarget = '>= 0.5% and supports es6-class';

	private outputDirByExportMap = {
		umd: 'dist',
		esm: 'esm',
		cjs: 'lib'
	};

	private config: BuildConfigConfigurationInterface = {
		packageName: null,
		inputDir: 'src',
		inputFile: null,
		outputFile: null,
		outputDir: null,
		formats: [],
		external: [],
		typescriptExclude: [],
		withSuffix: true,
		plugins: [],
		minifyEsm: false,
		bannerContent: this.bannerContent,
		commonJsEnabled: true,
		nodeResolveEnabled: true,
		hooks: {}
	}

	constructor(config: Partial<BuildConfigConfigurationInterface>) {
		this.config = {...this.config, ...config};
	}

	public generateConfigs(): Record<string, any>[] {
		const configs: Record<string, any>[] = [];
		const outputFile = this.config.outputFile || this.config.inputFile;

		this.config.formats.forEach((format: string) => {
			const esVersions = ['es6'];

			if (['umd', 'esm'].includes(format)) {
				esVersions.push('es5');
			}

			if (format=== 'umd' && this.isDevMode) {
				return;
			}

			esVersions.forEach((esVersion) => {
				const buildSuffixes = ['.js'];

				if (!this.isDevMode && (format === 'umd' || format === 'esm' && this.config.minifyEsm)) {
					buildSuffixes.push('.min.js');
				}

				const esSuffix = esVersion === 'es5' && ['umd', 'esm'].includes(format) ? '.es5' : '';

				buildSuffixes.forEach((suffix: string) => {
					suffix = this.config.withSuffix ? suffix : '';
					const plugins = this.config.plugins;
					configs.push({
						input: path.join(
							'packages',
							this.config.packageName,
							this.config.inputDir,
							`${this.config.inputFile}.ts`
						),
						external: this.config.external || [],
						output: {
							name: this.exportName,
							file: `${this.getOutputFilePath(outputFile, format)}${esSuffix}${suffix}`,
							format: format,
							exports: format === 'umd' ? 'auto' : 'named',
							banner: this.config.bannerContent || ''
						},
						plugins: this.getPlugins({
							terser: suffix === '.min.js',
							esVersion: esVersion
						}).concat(plugins)
					});
				});
			});
		});

		return configs;
	}

	private getOutputFilePath(outputFile: string, exportType: string): string {
		return path.join(
			'packages',
			this.config.packageName,
			this.config.outputDir || this.outputDirByExportMap[exportType],
			this.convertCamelCaseIntoDashCase(outputFile)
		);
	}

	private convertCamelCaseIntoDashCase(content: string): string {
		return content.replace(/[A-Z]/g, (match: string) => `-${match.toLowerCase()}`).replace(/^-{1}/, '');
	}

	private getTypescriptConfig(): any {
		return JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
	}

	private getBabelConfig(): any {
		return JSON.parse(fs.readFileSync('babel.config.json', 'utf8'));
	}

	private getPlugins(config: Record<string, any>) {
		const typescriptConfig = this.getTypescriptConfig();

		typescriptConfig.exclude = this.config.typescriptExclude.map((excludePath: string | string[]) => {
			if (!Array.isArray(excludePath)) {
				excludePath = [excludePath];
			}

			return path.join('packages', this.config.packageName, ...excludePath);
		});

		const babelConfig = this.getBabelConfig();
		delete babelConfig.include;
		babelConfig.presets.push([
			'@babel/preset-env', {
				bugfixes: true,
				modules: false,
				targets: config.esVersion === 'es5' ? this.babelOldBrowsersTarget : this.babelModernBrowsersTarget
			}
		]);
		babelConfig.extensions = this.buildFilesExtensions;
		babelConfig.babelHelpers = 'bundled';
		const plugins = [
			buildPlugin({
				hooks: this.config.hooks
			}),
			json(),
			this.config.commonJsEnabled ? commonjs() : null,
			this.config.nodeResolveEnabled ? nodeResolve({ extensions: this.buildFilesExtensions }) : null,
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
				__PACKAGE__VERSION__: lernaJson.version,
				preventAssignment: true
			}),
			typescript(typescriptConfig),
			babel(babelConfig),
			postcss({
				plugins: [
					postcssUrlPlugin({
						url: 'inline',
						limit: Infinity
					})
				],
				minimize: true
			})
		];

		if (!this.isDevMode) {
			// if (!plugins.includes(typesPlugin)) {
			// plugins.unshift(typesPlugin(this.config.packageName));
			// }

			if (config.terser) {
				plugins.push(
					terser({
						output: {
							comments: false
						}
					})
				);
			}
		}

		return plugins;
	}

}


export { BuildConfig };
