import path from 'path';
import { Bundler } from '../esm/index.mjs';

const watchFiles = process.argv[process.argv.length - 1] === '--w';
const outputDir = path.join('.', path.sep, 'css');
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const bundler = new Bundler({
	dev: watchFiles,
	configFile: __dirname + '/stylify.config.mjs',
	verbose: watchFiles,
	watchFiles: watchFiles,
	compiler: {
		mangleSelectors: !watchFiles
	},
	bundles: [
		{
			outputFile: path.join(outputDir, 'index.css'),
			files: [__dirname + '/src/**/*.html']
		}
	]
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bundler.bundle();
