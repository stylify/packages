import { defineConfig } from '../../lib/index.cjs';

export default defineConfig({
	extend: {
		compiler: {
			variables: {
				green: 'darkgreen'
			}
		}
	}
});
