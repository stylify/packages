import { defineConfig } from '@stylify/nuxt';

export default defineConfig({
	compiler: {
		mangleSelectors: true,
		variables: {
			blue: 'darkblue'
		}
	}
});
