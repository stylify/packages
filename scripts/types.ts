import 'v8-compile-cache';

import { TypesGenerator } from './TypesGenerator';

new TypesGenerator({
	stylify: null,
	autoprefixer: null,
	'nuxt-module': null,
	profiler: {
		jsx: true
	}
});
