import fs from 'fs';
import { Compiler } from '.';

export default class FilesCssCollector {

	private config: Record<string, any> = {};

	constructor(config: Record<string, any> = {}) {
		this.config = config;
	}

	public collect(filesAndDirectories: string[]) {
		const compiler = new Compiler(this.config.compiler || {});
	}

}
