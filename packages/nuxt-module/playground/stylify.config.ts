import { defineConfig } from '../esm';

export default defineConfig({
	sassVarsDirPath: './assets',
	extend: {
		compiler: {
			components: {
				button: 'color:blue'
			}
		},
		loaders: [
			{ test: /\.md/}
		]
	}
});
