import { defineConfig } from 'astro/config';
import stylifyIntegration from '@stylify/astro';


// https://astro.build/config
export default defineConfig({
	integrations: [stylifyIntegration()],
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
