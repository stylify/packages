import { nativePreset } from "@stylify/stylify";
import path from "path";
import { Bundler } from "../esm";

const bundler = new Bundler({
	compiler: nativePreset.compiler,
	watchFiles: false
});

const outputDir = path.join(__dirname, 'css');
bundler.bundle([
	{
		outputFile: path.join(outputDir, 'index.css'),
		files: path.join(__dirname, 'index.html')
	},
	{
		outputFile: path.join(outputDir, 'second.css'),
		files: path.join(__dirname, 'second.html')
	}
]);
