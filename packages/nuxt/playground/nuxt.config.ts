import { defineNuxtConfig } from 'nuxt';

export default defineNuxtConfig({
	modules: [
		['../esm/module.js', { addPlugin: true }]
	]
});
