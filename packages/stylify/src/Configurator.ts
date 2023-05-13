import { existsSync } from 'fs';
import { join } from 'path';
import type { CompilerConfigInterface } from './Compiler';

export type ConfiguratorConfigsType = Record<string, any>;

export type ObjectToMergeType = Record<string, any>;

export type OnConfigChangedCallbackType = <T extends DefaultConfigInterface>(config: T) => void;

export interface ConfigFiles {
	js?: string,
	mjs?: string,
	cjs?: string
}

export interface DefaultConfigInterface extends Record<string, any> {
	compiler?: CompilerConfigInterface
}

export class Configurator {

	public static defaultConfigName = 'stylify.config';

	public static getExistingConfigFiles(path: string): ConfigFiles {
		const configs: ConfigFiles = {};

		['js', 'mjs', 'cjs'].forEach((suffix) => {
			const filePath = join(path, `${this.defaultConfigName}.${suffix}`);
			if (existsSync(filePath)) {
				configs[suffix] = filePath;
			}
		});

		return configs;
	}

}
