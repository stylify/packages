import path from 'path';
import { Bundler } from '../esm/index.mjs';

const outputDir = path.join('.', path.sep, 'css');
const bundler = new Bundler({
	dev: true,
	verbose: true,
	watchFiles: true,
	bundles: [
		{
			outputFile: path.join(outputDir, 'index.css'),
			files: ['src/**/*.html']
		}
	]
});

bundler.bundle();
