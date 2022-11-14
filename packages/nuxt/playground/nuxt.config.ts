export default {
	server: {
		host: '0.0.0.0',
		port: '3000'
	},

	modules: [
		['@nuxt/content'],
		['../esm/module.mjs']
	]
};
