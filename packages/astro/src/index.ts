import type { AstroIntegration } from 'astro';
import {
	UnpluginConfigInterface,
	stylifyVite,
	defineConfig as stylifyUnpluginConfig,
	hooks as unpluginHooks
} from '@stylify/unplugin';
import { Configurator, mergeObjects } from '@stylify/stylify';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { default as normalize } from 'normalize-path';

export interface ConfigInterface extends UnpluginConfigInterface {
	importDefaultBundle?: boolean
}

export const hooks = unpluginHooks;

export const defineConfig = stylifyUnpluginConfig;

export const stylify = (options: ConfigInterface = {}): AstroIntegration => {

	return {
		name: '@stylify/astro',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, injectScript, command}): void => {
				const srcDir: string = normalize(join(fileURLToPath(config.root), 'src'));
				const singleBundleOutputFilePath: string = normalize(join(srcDir, 'styles', 'stylify.css'));
				const isDev = options.dev ?? (import.meta?.env?.DEV === true
					|| import.meta?.env?.MODE === 'development'
					|| command === 'dev'
					|| null);

				const generateDefaultBundle = typeof options.bundles === 'undefined';
				const defaultConfig: UnpluginConfigInterface = {
					dev: options.dev ?? isDev,
					bundler: {
						autoprefixerEnabled: false
					},
					bundles: generateDefaultBundle
						? [{
							outputFile: singleBundleOutputFilePath,
							files: [`${srcDir}/**/*.{astro,html,js,json,jsx,mjs,md,mdx,svelte,ts,tsx,vue,yaml}`]
						}]
						: []
				};

				const configs = Configurator.getExistingConfigFiles(fileURLToPath(config.root));
				const configsValues = Object.values(configs);

				if (configsValues.length > 0) {
					defaultConfig.configFile = configsValues;
				}

				updateConfig({
					vite: {
						plugins: [
							stylifyVite(mergeObjects(defaultConfig, options))
						]
					}
				});

				if ((options.importDefaultBundle ?? true) && generateDefaultBundle) {
					injectScript('page-ssr', `import '${singleBundleOutputFilePath}';`);
				}
			}
		}
	};
};

export default stylify;
