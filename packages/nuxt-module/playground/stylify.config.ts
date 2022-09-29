import { defineConfig } from '../esm';

export default defineConfig({
	sassVarsDirPath: './assets',
	compiler: {
		components: {
			button: 'color:blue'
		}
	},
	loaders: [
		{ test: /\.md/}
	]
});
