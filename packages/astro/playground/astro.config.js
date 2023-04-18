//import node from '@astrojs/node';
import stylify from '@stylify/astro';

export default {
	integrations: [
		stylify({
			importDefaultBundle: false
		})
	],
	//adapter: node,
	//output: server,
	server: {
		host: '0.0.0.0',
		port: 3000
	}
};
