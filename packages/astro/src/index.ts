import type { AstroIntegration } from 'astro';
import { UnpluginConfigInterface, vitePlugin, defineConfig as stylifyUnpluginConfig } from '@stylify/unplugin';
import { Configurator } from '@stylify/stylify';
import { fileURLToPath } from 'url';
import { join } from 'path';

export const defineConfig = stylifyUnpluginConfig;

export const stylifyIntegration = (options?: UnpluginConfigInterface): AstroIntegration => {

	return {
		name: '@stylify/astro',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, injectScript, command}): void => {
				const srcDir = join(fileURLToPath(config.root), 'src');
				const singleBundleOutputFilePath = join(srcDir, 'styles', 'stylify.css');
				const isDev = import.meta?.env?.DEV
					|| import.meta?.env?.MODE === 'development'
					|| command === 'dev'
					|| false;

				updateConfig({
					vite: {
						plugins: [
							vitePlugin([
								{
									dev: isDev,
									configFile: Configurator.getDefaultConfigPath(fileURLToPath(config.root)),
									compiler: {
										mangleSelectors: !isDev
									},
									bundles: options?.bundles ? [] : [{
										outputFile: singleBundleOutputFilePath,
										files: [join(srcDir, `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)]
									}]
								},
								options ?? {}
							])
						]
					}
				});

				injectScript('page-ssr', `import '${singleBundleOutputFilePath}';`);
			}
		}
	};
};

export default stylifyIntegration;
