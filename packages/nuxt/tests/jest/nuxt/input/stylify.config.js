import { defineConfig } from '../../esm/module.mjs';

export default defineConfig({
	extend: {
		compiler: {
			variables: {
				blue: 'darkblue'
			}
		}
	}
});
