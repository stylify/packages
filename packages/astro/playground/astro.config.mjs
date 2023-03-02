import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import stylify from '@stylify/astro';

export default defineConfig({
	integrations: [stylify()],
	output: 'server',
	adapter: node(),
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
