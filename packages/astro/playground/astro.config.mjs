import { defineConfig } from 'astro/config';
import stylifyIntegration from '../esm/index.mjs';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	integrations: [stylifyIntegration()],
	experimental: { integrations: true },
	output: 'server',
	adapter: node(),
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
