import { nativePreset } from '@stylify/stylify';
import path from 'path';
import { Bundler } from '../esm';

const outputDir = path.join(__dirname, 'css');
const bundler = new Bundler({
	compiler: nativePreset.compiler,
	watchFiles: false,
	bundles: [
		{
			outputFile: path.join(outputDir, 'index.css'),
			files: path.join(__dirname, 'index.html')
		}
	]
});

bundler.bundle();
