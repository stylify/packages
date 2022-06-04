import { nativePreset } from '@stylify/stylify';
import path from 'path';
import { Bundler } from '../esm';

const outputDir = path.join(__dirname, 'css');
const bundler = new Bundler({
	compiler: nativePreset.compiler,
	verbose: true,
	watchFiles: true,
	bundles: [
		{
			outputFile: path.join(outputDir, 'index.css'),
			files: path.join(__dirname, 'index.html')
		}
	]
});

bundler.bundle();
