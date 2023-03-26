import { defineConfig } from '@stylify/nuxt';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
	stylify: defineConfig({
		configPath: 'stylify.custom.config.js',
		// TODO tohle prošlo?
		compiler: {
			variables: {
				red: 'darkred',
				green: 'darkgreen'
			},
			macros: {
				'clr:(\\S+?)': function ({macroMatch, selectorProperties}) {
					selectorProperties.add('color', macroMatch.getCapture(0));
				}
			}
		}
	}),
	modules: [
		'@nuxt/content',
		'@stylify/nuxt',
	]
});
