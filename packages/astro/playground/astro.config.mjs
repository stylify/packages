import { defineConfig } from 'astro/config';
import stylify from '../esm';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	integrations: [stylify()],
	output: 'server',
	adapter: node(),
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
