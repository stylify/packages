import { defineConfig } from '../../esm/module.mjs';

export default defineConfig({
	extend: {
		compiler: {
			variables: {
				green: 'darkgreen'
			}
		}
	}
});
