
import fs from 'fs';
import banner from 'rollup-plugin-banner';
import { terser } from 'rollup-plugin-terser';
import { babel } from '@rollup/plugin-babel';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssUrlPlugin from 'postcss-url';
import typescript from 'rollup-plugin-typescript2';

export interface BuildConfigConfigurationInterface {
	packageName: string | null,
	inputDir: 'src' | string
	inputFile: string | null,
	outputFile: string | null,
	formats: string[],
	external: string[],
	typescriptExclude: string[][] | string[],
	withSuffix: boolean,
	plugins: [],
	minifyEsm: false | boolean
}

class BuildConfig {

	private exportName = 'Stylify';

	private isDevMode = process.env.ROLLUP_WATCH || process.env.JEST_WORKER_ID !== undefined;

	private buildFilesExtensions = ['.js', '.ts', 'tsx'];

	private bannerContent = `
		<%= pkg.name %> v<%= pkg.version %>
		(c) 2021-present <%= pkg.author %>
		Released under the MIT License.
	`.trim();

	private babelOldBrowsersTarget = '> 0.25%, not dead, not ie 11';

	private babelModernBrowsersTarget = '>= 0.5% and supports es6-class';

	private outputDirByExportMap = {
		umd: 'dist',
		esm: 'esm',
		cjs: 'lib'
	};

	private config: Record<string, any> = {
		packageName: null,
		inputDir: 'src',
		inputFile: null,
		outputFile: null,
		formats: [],
		external: [],
		typescriptExclude: [],
		withSuffix: false,
		plugins: [],
		minifyEsm: false
	}

	constructor(config: Partial<BuildConfigConfigurationInterface>) {
		this.config = {...this.config, ...config};
	}

	public generateConfigs(): Record<string, any>[] {
		const configs: Record<string, any>[] = [];
		const outputFile = this.config.outputFile || this.config.inputFile;

		this.config.formats.forEach((format: string) => {
			const esVersions = ['es6'];

			if (format === 'umd') {
				esVersions.push('es5');

				if (this.isDevMode) {
					return;
				}
			}

			esVersions.forEach((esVersion) => {
				const buildSuffixes = ['.js'];

				if (!this.isDevMode && (format === 'umd' || format === 'esm' && this.config.minifyEsm)) {
					buildSuffixes.push('.min.js');
				}

				buildSuffixes.forEach((suffix: string) => {
					const plugins = this.config.plugins || {};
					configs.push({
						input: path.join(
							'packages',
							this.config.packageName,
							this.config.inputDir,
							`${this.config.inputFile as string}.ts`
						),
						external: this.config.external || [],
						output: {
							name: this.exportName,
							file: `${this.getOutputFilePath(outputFile, format)}${suffix}`,
							format: format,
							exports: format === 'umd' ? 'auto' : 'named'
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
			this.outputDirByExportMap[exportType],
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
		babelConfig.presets.push([
			'@babel/preset-env', {
				bugfixes: true,
				modules: false,
				target: config.esVersion === 'es5' ? this.babelOldBrowsersTarget : this.babelModernBrowsersTarget
			}
		]);
		babelConfig.extensions = this.buildFilesExtensions;
		babelConfig.babelHelpers = 'bundled';

		const plugins = [
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
				preventAssignment: true
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
				extensions: this.buildFilesExtensions
			})
		];

		if (!this.isDevMode && config.terser) {
			plugins.push(
				terser({
					output: {
						comments: false
					}
				})
			);
		}

		if (!this.isDevMode) {
			plugins.push(
				banner(this.bannerContent)
			);
		}

		return plugins;
	}

}


export { BuildConfig };
