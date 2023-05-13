import { defineConfig } from '../esm';

export default defineConfig({
	sassVarsExportPath: './assets',
	compiler: {
		components: {
			button: 'color:blue'
		}
	},
	loaders: [
		{ test: /\.md/}
	]
});
