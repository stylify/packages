import { defineConfig } from 'astro/config';
import { stylifyIntegration } from '@stylify/astro';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	integrations: [stylifyIntegration()],
	output: 'server',
	adapter: node(),
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
