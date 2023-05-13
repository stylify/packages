import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { stylifyVite } from '../../src';

const stylifyPlugin = stylifyVite({
	// Because of the tmp dir, that is ignored by default
	compiler: {
		mangleSelectors: true,
		cssVariablesEnabled: false
	},
	bundles: [
		{
			outputFile: './src/stylify.css',
			files: ['./src/**']
		}
	],
	bundler: {
		showBundlesStats: false
	}
});

export default defineConfig({
	plugins: [stylifyPlugin, react()]
});
