import FastGlob from 'fast-glob';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';

const rootDir = path.join(__dirname, '..', '..');
const outputDirs = ['esm', 'lib', 'dist'];
const buildStatsFilePath = path.join(rootDir, 'build-stats.json');
const packagesDirPath = path.join(rootDir, 'packages');

const getRegisteredPackages = (selectedPackage: string = null) => readdirSync(packagesDirPath, { withFileTypes: true })
	.filter((dirent) => {
		if (!dirent.isDirectory()) {
			return false;
		}

		if (selectedPackage && dirent.name !== selectedPackage) {
			return false;
		}

		return true;
	})
	.map(dirent => dirent.name);

const getPackagesOutputStats = (selectedPackage: string = null) => {
	const registeredPackages = getRegisteredPackages(selectedPackage);
	const stats = {};
	for (const registeredPackage of registeredPackages) {
		stats[registeredPackage] = {};

		const packageDirDirPath = path.join(packagesDirPath, registeredPackage);
		for (const outputDir of outputDirs) {
			const outputDirPath = path.join(packageDirDirPath, outputDir);
			const files = FastGlob.sync([
				path.join(outputDirPath, '*', '*.js'),
				path.join(outputDirPath, '**', '*.js'),

				path.join(outputDirPath, '*', '*.cjs'),
				path.join(outputDirPath, '**', '*.cjs'),

				path.join(outputDirPath, '*', '*.mjs'),
				path.join(outputDirPath, '**', '*.mjs')
			]);

			for (const file of files) {
				const fileStats = statSync(file);

				stats[registeredPackage][file.replace(packageDirDirPath, '')] = {
					size: fileStats.size
				};
			}
		}
	}

	return stats;
};

let releaseBuildStats: Record<string, any> = null;
const getReleaseBuildStats = () => {
	if (releaseBuildStats === null) {
		releaseBuildStats = JSON.parse(readFileSync(buildStatsFilePath, 'utf-8'));
	}

	return releaseBuildStats;
};

export const compareBuildStats = (selectedPackage: string = null) => {
	const releaseBuildStats = getReleaseBuildStats();
	const stats = getPackagesOutputStats(selectedPackage);
	const statsDiff: Record<string, Record<string, any>> = {};

	for (const packageName in stats) {
		statsDiff[packageName] = {};
		const packageDir = path.join(packagesDirPath, packageName);

		for (const file in stats[packageName]) {
			const completeFilePath = path.join(packageDir, file);

			if (!existsSync(completeFilePath)) {
				statsDiff[packageName][file] = 'New file';
				continue;
			}

			const fileStats = statSync(completeFilePath);
			if (fileStats.size !== releaseBuildStats[packageName][file].size) {
				const sizeChange = -(releaseBuildStats[packageName][file].size - fileStats.size);
				statsDiff[packageName][file] = `${sizeChange > 0 ? '+' : ''}${sizeChange / 1000} KB`;
				continue;
			}
		}
	}

	for (const packageName in releaseBuildStats) {
		if (!(packageName in statsDiff)) {
			statsDiff[packageName] = {};
		}

		const packageDir = path.join(packagesDirPath, packageName);

		for (const file in releaseBuildStats[packageName]) {
			const completeFilePath = path.join(packageDir, file);

			if (!existsSync(completeFilePath)) {
				statsDiff[packageName][file] = 'Removed file';
				continue;
			}
		}
	}

	// eslint-disable-next-line no-console
	console.log('-----------------');
	Object.keys(statsDiff).forEach((packageName) => {
		if (Object.keys(statsDiff[packageName]).length > 0) {
			// eslint-disable-next-line no-console
			console.log(`\n${packageName}`);
			// eslint-disable-next-line no-console
			console.table(statsDiff[packageName]);
		}
	});
};

export const generateStatsOutputFile = () => {
	const stats = getPackagesOutputStats();

	writeFileSync(buildStatsFilePath, JSON.stringify(stats, null, 2));
};
