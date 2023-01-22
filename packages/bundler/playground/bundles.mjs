import path from 'path';
import { Bundler } from '../esm/index.mjs';

const watchFiles = process.argv[process.argv.length - 1] === '--w';

const outputDir = path.join('.', path.sep, 'css');
const bundler = new Bundler({
	dev: watchFiles,
	verbose: watchFiles,
	watchFiles: watchFiles,
	compiler: {
		mangleSelectors: !watchFiles
	},
	bundles: [
		{
			outputFile: path.join(outputDir, 'index.css'),
			files: ['src/**/*.html']
		}
	]
});

bundler.bundle();
