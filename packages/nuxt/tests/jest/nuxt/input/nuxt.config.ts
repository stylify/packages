import { defineConfig } from '../../esm/module.mjs';
import { defineNuxtConfig } from 'nuxt';

export default defineNuxtConfig({
	stylify: defineConfig({
		configPath: 'stylify.custom.config.js',
		// TODO tohle prošlo?
		compiler: {
			variables: {
				red: 'darkred'
			},
			macros: {
				'clr:(\\S+?)': function (macroMatch, cssProperties) {
					cssProperties.add('color', macroMatch.getCapture(0));
				}
			}
		}
	}),
	buildModules: [
		'../../esm/module.mjs'
	]
});
