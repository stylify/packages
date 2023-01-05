/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */
import 'v8-compile-cache';
import path from 'path';
import { exec } from 'child_process';
import fse from 'fs-extra';
import packageJson from '../../package.json';
import { env, exit } from 'process';
import esbuild, { BuildOptions, BuildResult, Format, Platform } from 'esbuild';
import { compareBuildStats } from './output-stats';

export type BundleFormatType = Format | 'esm-browser' | 'esm-lib';

interface BuildConfigBundlesConfigInterface {
	entryPoints: string[]
	formats: BundleFormatType[] | BundleFormatType
	outfile: string
	outdir?: string
	bundle?: true | boolean,
	minify?: false | boolean,
	external?: string[],
	platform?: Platform
}

interface BuildConfigConfigurationInterface {
	package: string,
	beforeBundle?: () => Promise<void>;
	watch?: false | boolean
	bundles: BuildConfigBundlesConfigInterface[]
}

export const isWatchMode = 'watch' in env;
export const generateTypes = !('typesDisabled' in env);
export const isDevMode = 'dev' in env;
const selectedPackages = 'packages' in env ? env.packages.split(',') : [];

const filesBanner = `
/**
*	(c) 2021-present ${packageJson.author}
*	Released under the MIT License.
*/
`.trim();

const packagesDir = path.join(__dirname, '..', '..', 'packages');
const typescriptTypesBuilds: Promise<void>[] = [];
const bundles: Promise<BuildResult[]>[] = [];
const processedPackages: string[] = [];

export const getPackageDir = (packageName: string) => path.join(packagesDir, packageName);

export const runBuild = async (buildFunction): Promise<void> => {
	console.info('Build start.');

	await buildFunction();
	await Promise.all(bundles);

	if (typescriptTypesBuilds.length) {
		console.info('Builds done. Waiting for types.');
		await Promise.all(typescriptTypesBuilds);
	}

	if (!isWatchMode) {
		console.info('Build complete.');
	}

	compareBuildStats(processedPackages.length > 1 ? null : processedPackages[0]);
};

const runEsbuild = async (config: BuildConfigConfigurationInterface): Promise<BuildResult[]> => {
	if (selectedPackages.length && !selectedPackages.includes(config.package)) {
		return;
	}

	if (!(config.package in processedPackages)) {
		processedPackages.push(config.package);
	}

	const buildsResults: Promise<BuildResult>[] = [];

	const defaultConfig: Partial<BuildConfigConfigurationInterface> = {
		watch: isWatchMode
	};

	const mergedConfig = {...defaultConfig, ...config};
	const packageDir = getPackageDir(mergedConfig.package);
	const outputDirs: Record<string, string> = {
		iife: 'dist',
		esm: 'esm',
		'esm-browser': 'esm',
		'esm-lib': 'lib',
		cjs: 'lib'
	};

	const outputSuffixes: Record<string, string> = {
		iife: 'js',
		esm: 'mjs',
		'esm-browser': 'js',
		'esm-lib': 'mjs',
		cjs: 'cjs'
	};

	const purgeDirs: Promise<void>[] = [];
	const dirsToPurge = ['types', ...Object.values(outputDirs)];

	dirsToPurge.forEach((outputDir) => {
		purgeDirs.push(new Promise((resolve) => {
			const dirToPurge = path.join(packageDir, outputDir);
			if (fse.existsSync(dirToPurge)) {
				fse.rmdirSync(dirToPurge, { recursive: true, force: true });
			}
			resolve();
		}));
	});

	await Promise.all(purgeDirs);

	if (typeof mergedConfig.beforeBundle === 'function') {
		await mergedConfig.beforeBundle();
	}

	for (const bundleConfig of mergedConfig.bundles) {
		if (!Array.isArray(bundleConfig.formats)) {
			bundleConfig.formats = [bundleConfig.formats];
		}

		bundleConfig.platform = bundleConfig.platform ?? 'node';

		for (const format of bundleConfig.formats) {
			const isBrowserOutput = ['esm-browser', 'esm-lib', 'iife'].includes(format);
			const suffixes = [''];
			let shouldMinify = !isDevMode && isBrowserOutput;

			if (typeof bundleConfig.minify !== 'undefined') {
				shouldMinify = bundleConfig.minify;
			}

			if (isWatchMode) {
				shouldMinify = false;
			}

			if (shouldMinify) {
				suffixes.push('.min');
			}

			for (const suffix of suffixes) {
				const parsedOutputFilePath = path.parse(bundleConfig.outfile);
				const buildConfig: BuildOptions = {
					entryPoints: bundleConfig.entryPoints.map((filePath) => path.join(packageDir, filePath)),
					watch: mergedConfig.watch,
					format: ['esm-browser', 'esm-lib'].includes(format) ? 'esm' : format as Format,
					bundle: bundleConfig.bundle ?? true,
					minify: shouldMinify && suffix === '.min',
					banner: { js: filesBanner },
					target: isBrowserOutput && bundleConfig.platform !== 'node' ? 'es2016' : 'es2020',
					platform: isBrowserOutput && bundleConfig.platform !== 'node'
						? 'browser'
						: bundleConfig.platform ?? 'browser',
					external: bundleConfig.external ?? [],
					logLevel: isWatchMode ? 'info' : 'error',
					loader: {
						'.woff': 'base64',
						'.svg': 'dataurl'
					},
					outfile: path.join(
						packageDir,
						outputDirs[format],
						parsedOutputFilePath.dir,
						`${parsedOutputFilePath.base}${suffix}${'.' + outputSuffixes[format]}`
					)
				};
				buildsResults.push(esbuild.build(buildConfig));
			}
		}
	}

	const typesDirsString = path.join(packageDir, 'src', '**', '*.ts') + ' ' + path.join(packageDir, 'src', '*.ts');
	const typesOutputDir = path.join(packageDir, 'types');

	if (!mergedConfig.watch && generateTypes) {
		typescriptTypesBuilds.push(new Promise((resolve) => {
			const tscCommand = [
				`yarn tsc ${typesDirsString}`,
				'-d --emitDeclarationOnly',
				`--outDir ${typesOutputDir}`
			];

			exec(tscCommand.join(' '), () => {
				console.info(`Types generated: ${mergedConfig.package}`);
				resolve();
			});
		}));
	}

	const result = Promise.all(buildsResults);

	result.finally(() => {
		console.info(`Bundled: ${config.package}`);
	});

	result.catch((e) => {
		if (!isWatchMode) {
			console.error(e);
			exit();
		}
	});

	return result;
};

export const bundle = async (config: BuildConfigConfigurationInterface): Promise<BuildResult[]> => {
	const bundle = runEsbuild(config);
	bundles.push(bundle);
	return bundle;
};

export const bundleSync = async (config: BuildConfigConfigurationInterface): Promise<BuildResult[]> => {
	const reusult = await bundle(config);
	return reusult;
};
