import { defineNuxtConfig } from 'nuxt';

export default defineNuxtConfig({
	server: {
		host: '0.0.0.0'
	},
	modules: [
		['@nuxt/content'],
		['../esm/module.js', { addPlugin: true }]
	]
});
