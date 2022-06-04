import { defineConfig } from '@stylify/unplugin';

export default defineConfig({
	extend: {
		compiler: {
			variables: {
				red: 'darkred'
			},
			components: {
				button: 'color:blue'
			}
		}
	}
});
