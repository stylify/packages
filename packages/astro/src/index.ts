import type { AstroIntegration } from 'astro';
import { UnpluginConfigInterface, vitePlugin, defineConfig as stylifyUnpluginConfig } from '@stylify/unplugin';
import { Configurator } from '@stylify/stylify';
import { fileURLToPath } from 'url';
import { join } from 'path';

export const defineConfig = stylifyUnpluginConfig;

export const stylify = (options: UnpluginConfigInterface = {}): AstroIntegration => {

	return {
		name: '@stylify/astro',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, injectScript, command}): void => {
				const srcDir = join(fileURLToPath(config.root), 'src');
				const singleBundleOutputFilePath = join(srcDir, 'styles', 'stylify.css');
				const isDev = options?.dev ?? (import.meta?.env?.DEV === true
					|| import.meta?.env?.MODE === 'development'
					|| command === 'dev'
					|| null);

				const defaultConfig: UnpluginConfigInterface = {
					dev: options?.dev ?? isDev,
					compiler: {
						mangleSelectors: options?.compiler?.mangleSelectors ?? !isDev,
						selectorsAreas: ['(?:^|\\s+)class:list=\\{\\[((?:.|\\n)+)\\]\\}']
					},
					bundles: options?.bundles ? [] : [{
						outputFile: singleBundleOutputFilePath,
						files: [join(srcDir, `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)]
					}]
				};

				const configs = Configurator.getDefaultExistingConfigFiles(fileURLToPath(config.root));
				const configsTypes = Object.keys(configs);

				if (configsTypes.length > 0) {
					defaultConfig.configFile = configs[configsTypes[0]];
				}

				updateConfig({
					vite: {
						plugins: [
							vitePlugin([defaultConfig, options ?? {}])
						]
					}
				});

				injectScript('page-ssr', `import '${singleBundleOutputFilePath}';`);
			}
		}
	};
};

export default stylify;
