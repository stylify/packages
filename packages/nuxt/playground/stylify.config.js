import { defineConfig } from '@stylify/unplugin';

export default defineConfig({
	compiler: {
		variables: {
			red: 'darkred'
		},
		components: {
			button: 'color:blue'
		}
	}
});
