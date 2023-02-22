import { defineConfig } from '@stylify/astro';

export default defineConfig({
	compiler: {
		variables: {
			blue: 'darkblue'
		},
		cssVariablesEnabled: false
	}
});
