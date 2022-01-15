import path from 'path';
import fse from 'fs-extra';
import fs, { fstatSync } from 'fs';
import { Bundler } from '../../src'
import { nativePreset } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'hooks';
const testUtils = new TestUtils('bundler', testName);
nativePreset.compiler.dev = true;

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

new Bundler({
	compiler: nativePreset.compiler,
	verbose: false,
	onBeforeCssFileCreated: (data) => {
		const filePathInfo = path.parse(data.filePath);
		data.filePath = path.join(filePathInfo.dir, filePathInfo.name + '.scss');
		data.content = `/* File content changed during build */\n${data.content}`;
	},
	onBundleProcessed: (data) => {
		const filePathInfo = path.parse(data.bundleConfig.outputFile);
		fs.writeFileSync(path.join(filePathInfo.dir, filePathInfo.name + '.txt'), '')
	}
}).bundle([
   	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [
			path.join(buildTmpDir, 'index.html'),
		],
		compiler: {
			mangleSelectors: true
		},
		onBeforeInputFileRewritten: (data) => {
			const filePathInfo = path.parse(data.filePath);
			data.filePath = path.join(filePathInfo.dir, filePathInfo.name + '.html');
			data.content = `<!-- File content changed during build. -->\n${data.content}`;
		},
	},
 	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		files: [
			path.join(buildTmpDir, 'second.html'),
		],
		onBundleProcessed: (data) => {
			const filePathInfo = path.parse(data.bundleConfig.outputFile);
			fs.writeFileSync(path.join(filePathInfo.dir, filePathInfo.name + '-modified.txt'), '')
		}
	}
]);

test('Bundler - single file', (): void => {
	const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'index.scss')).toString();
	const secondCssOutput = fs.readFileSync(path.join(buildTmpDir, 'second.scss')).toString();
	const indexHtmlOutput = fs.readFileSync(path.join(buildTmpDir, 'index.html')).toString();
	const secondHtmlOutput = fs.readFileSync(path.join(buildTmpDir, 'second.html')).toString();

	const indexTxtExists = fs.existsSync(path.join(buildTmpDir, 'index.txt'));
	const secondTxtExists = fs.existsSync(path.join(buildTmpDir, 'second-modified.txt'));

 	testUtils.testToBe(indexTxtExists, true);
	testUtils.testToBe(secondTxtExists, true);

	testUtils.testCssFileToBe(indexCssOutput);
	testUtils.testCssFileToBe(secondCssOutput, 'second');

	testUtils.testHtmlFileToBe(indexHtmlOutput);
	testUtils.testHtmlFileToBe(secondHtmlOutput, 'second');
});
