const fs = require('fs');
const path = require('path');

export default class TestUtils {

	private testName: string = null;

	constructor(testName: string) {
		this.testName = testName;
	}

	public getTestFile(fileType: string, fileName: string): string {
		return fs.readFileSync(path.join(__dirname, this.testName, fileType, fileName), 'utf8');
	}

	public getInputFile(fileName: string): string {
		return this.getTestFile('input', fileName);
	}

	public getExpectedFile(fileName: string): string {
		return this.getTestFile('expected', fileName);
	}

	public getJsonInputFile(fileName: string = 'index'): string {
		return this.getInputFile(`${fileName}.json`);
	}

	public getHtmlInputFile(fileName: string = 'index'): string {
		return this.getInputFile(`${fileName}.html`);
	}

	public getCssInputFile(fileName: string = 'index'): string {
		return this.getInputFile(`${fileName}.css`);
	}

	public saveTmpFile(
		fileName: string,
		fileContent: string|any[]|Record<any, any>,
		jsonIndentationSize: number = null
	): void {
		const fileContentType = typeof fileContent;

		if (fileContent === null || ['boolean', 'number'].includes(fileContentType)) {
			return;
		}

		const tmpDir = path.join(__dirname, '..', '..', 'tmp', this.testName);

		if (!fs.existsSync(tmpDir)) {
			fs.mkdirSync(tmpDir, {recursive: true})
		}

		fs.writeFileSync(
			path.join(tmpDir, fileName),
			fileContentType === 'object' ? JSON.stringify(fileContent, null, jsonIndentationSize) : fileContent
		);
	}

	public testToBe(actual: any, expected: any, tmpFileName: string = null): void {
		this.saveTmpFile(tmpFileName, actual);
		expect(actual).toBe(expected);
	}

	public testMatchObject(actual: Record<any, any>, expected: Record<any, any>, tmpFileName: string = null): void {
		this.saveTmpFile(tmpFileName, actual);
		expect(actual).toMatchObject(expected);
	}

	public testJsonFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testMatchObject(actualContent, JSON.parse(this.getExpectedFile(`${expectedFileName}.json`)), `${expectedFileName}.json`);
	}

	public testCssFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testToBe(actualContent, this.getExpectedFile(`${expectedFileName}.css`), `${expectedFileName}.css`);
	}

	public testHtmlFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testToBe(actualContent, this.getExpectedFile(`${expectedFileName}.html`), `${expectedFileName}.html`);
	}

}
