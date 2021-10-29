import fs from 'fs';
import path from 'path';
import { BuildConfig, BuildConfigConfigurationInterface } from '.';
import { argumentsProcessor } from '../ArgumentsProcessor/ArgumentsProcessor';
import { RollupHooksListInterface } from './buildPlugin';

export interface BuildConfigurationInterface {
	packageName: string,
	hooks?: RollupHooksListInterface,
	typescriptExclude?: string[][] | string[],
	configs: Partial<BuildConfigConfigurationInterface>[]
}

class Build {

	private buildDirectories = ['dist', 'esm', 'lib'];

	private buildConfigs = [];

	public addConfigs(config: BuildConfigurationInterface): void {
		if (!argumentsProcessor.canProcessPackage(config.packageName)) {
			return;
		}

		this.prepareBuildDirectories(config.packageName);

		for (const buildConfig of config.configs) {
			buildConfig.packageName = config.packageName;
			buildConfig.typescriptExclude = config.typescriptExclude || [];
			buildConfig.hooks = config.hooks;
			this.buildConfigs.push(new BuildConfig(buildConfig));
		}
	}

	public getConfigs(): Record<string, any>[] {
		let configs: Record<string, any>[] = [];

		this.buildConfigs.forEach((buildConfig: BuildConfig) => {
			configs = [...configs, ...buildConfig.generateConfigs()];
		});

		return configs;
	}

	public getPackageDir(packageName: string): string {
		return path.join(__dirname, '..', 'packages', packageName);
	}

	private prepareBuildDirectories(packageName: string) {
		this.buildDirectories.forEach(directory => {
			const directoryToPrepare = path.join(this.getPackageDir(packageName), directory);
			if (fs.existsSync(directoryToPrepare)) {
				fs.rmdirSync(directoryToPrepare, { recursive: true });
			}
		});
	}
}

export const build = new Build();
