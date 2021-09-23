import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import glob from 'glob';
import path from 'path';
import { Bundle } from ".";
import type { CompilationResult, Compiler } from "@stylify/stylify";


export interface BundlerConfigInterface {
	outputPath: string,
	compiler: Compiler,
	watchFiles: boolean
}

class Bundler {

	private outputDir: string = null;

	private compiler: Compiler = null;

	private watchFiles: boolean = false;

	constructor(config: Partial<BundlerConfigInterface>) {
		this.outputDir = config.outputPath;
		this.compiler = config.compiler;
		this.watchFiles = config.watchFiles;
	};

	public async bundle(name: string, files: string []) {
		let compilationResult: CompilationResult = null;
		let filesCompleteList = [];

		for (const file of files ) {
			await glob(file, null, (err, matches) => {
				filesCompleteList = [...filesCompleteList, ...matches];
			});
		}

		for (const file of filesCompleteList) {
			const content = readFileSync(file);
			compilationResult = this.compiler.compile(content.toString(), compilationResult);
		}

		writeFile(path.join(this.outputDir, name + '.css'), compilationResult.generateCss());
		writeFile(path.join(this.outputDir, 'stylify-cache.json'), JSON.stringify(compilationResult.serialize()));

		if (this.watchFiles) {

		}
	}

	private getStylifyDirectivesFromFile(fileContent: string): Record<string, any> {
		return {}
	}
}

export { Bundler };

export default Bundler;
