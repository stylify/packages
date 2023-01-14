const fs = require('fs');
const path = require('path');
const os = require('os')

export default class TestUtils {

	private packageName: string|null = null;

	private testName: string|null = null;

	private isWindowsEnv = os.platform() === 'win32'

	constructor(packageName: string, testName: string) {
		this.packageName = packageName;
		this.testName = testName;

		const tmpDir = path.join(this.getTmpDir(), testName);
		const tmpBuildDir = tmpDir + '-build';

		if (fs.existsSync(tmpDir)) {
			fs.rmdirSync(tmpDir, { recursive: true });
		}

		if (fs.existsSync(tmpBuildDir)) {
			fs.rmdirSync(tmpBuildDir, { recursive: true });
		}
	}

	public getPackageDir(): string {
		return path.join(__dirname, '..', 'packages', this.packageName);
	}

	public getTestName(): string|null {
		return this.testName;
	}

	public getTestDir(testsType = 'jest'): string {
		return path.join(this.getPackageDir(), 'tests', testsType, this.testName);
	}

	public readFile(filePath: string): string {
		return fs.readFileSync(filePath, 'utf8').trim();
	}

	public getTestFile(fileType: string, fileName: string): string {
		return this.readFile(path.join(this.getTestDir(), fileType, fileName));
	}

	public getInputFile(fileName: string): string {
		return this.getTestFile('input', fileName);
	}

	public getExpectedFile(fileName: string): string {
		return this.getTestFile('expected', fileName);
	}

	public getTxtInputFile(fileName: string = 'index'): string {
		return this.getInputFile(`${fileName}.txt`);
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

	public getTmpDir(): string {
		return path.join(this.getPackageDir(), 'tests-tmp');
	}

	public saveTmpFile(fileName: string, fileContent: string|any[]|Record<any, any>): void {
		const fileContentType = typeof fileContent;

		if (fileContent === null || ['boolean', 'number'].includes(fileContentType)) {
			return;
		}

		const tmpFilePath = path.join(this.getTmpDir(), this.testName, fileName);
		const tmpFilePathDir = path.dirname(tmpFilePath);

		if (!fs.existsSync(tmpFilePathDir)) {
			fs.mkdirSync(tmpFilePathDir, {recursive: true})
		}

		const fileContentToSave = fileContentType === 'object' ? JSON.stringify(fileContent) : fileContent;
		fs.writeFileSync(tmpFilePath, `${fileContentToSave.trim()}\n`);
	}

	public testToBe(actual: any, expected: any, tmpFileName: string|null = null): void {
		if (tmpFileName) {
			this.saveTmpFile(tmpFileName, actual);
		}
		expect(this.unitWhiteSpace(actual)).toBe(this.unitWhiteSpace(expected));
	}

	public testMatchObject(actual: Record<any, any>, expected: Record<any, any>, tmpFileName: string|null = null): void {
		if (tmpFileName) {
			this.saveTmpFile(tmpFileName, actual);
		}

		expect(actual).toMatchObject(expected);
	}

	public testJsonFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testMatchObject(actualContent, JSON.parse(this.getExpectedFile(`${expectedFileName}.json`)), `${expectedFileName}.json`);
	}

	public testCssFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testFileToBe(actualContent, 'css', expectedFileName);
	}

	public testHtmlFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testFileToBe(actualContent, 'html', expectedFileName);
	}

	public testJsFileToBe(actualContent: any, expectedFileName: string = 'index') {
		this.testFileToBe(actualContent, 'js', expectedFileName);
	}

	public testFileToBe(actualContent: any, suffix: string, expectedFileName: string = 'index') {
		const expecedFile = `${expectedFileName}.${suffix}`;
		this.testToBe(actualContent, this.getExpectedFile(expecedFile), expecedFile);
	}

	private unitWhiteSpace(content: string) {
		if (typeof content !== 'string' || !this.isWindowsEnv) {
			return content;
		};

		return content.replace(/\s+/g, ' ');
	}

}
