import { defineConfig } from 'astro/config';
import stylifyIntegration from '@stylify/astro';


// https://astro.build/config
export default defineConfig({
	integrations: [stylifyIntegration()],
	experimental: { integrations: true },
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
