import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'multiple-files-same-selectors';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

const bundler = new Bundler({
	dev: true,
	showBundlesStats: false,
	filesBaseDir: bundleTestDir,
	compiler: {
		mangleSelectors: true
	}
});

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

bundler.bundle([
	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [
			path.join(buildTmpDir, 'index.html'),
		]
	},
	{
		outputFile: path.join(buildTmpDir, 'layout.css'),
		files: [
			path.join(buildTmpDir, 'layout.html'),
		]
	}
]);

test('Bundler - multiple files - same selectors', async () => {
	const indexHtmlOutput = testUtils.readFile(path.join(buildTmpDir, 'index.html'));
	const layoutHtmlOutput = testUtils.readFile(path.join(buildTmpDir, 'layout.html'));

	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
	const layoutCssOutput = testUtils.readFile(path.join(buildTmpDir, 'layout.css'));

	testUtils.testCssFileToBe(indexCssOutput);
	testUtils.testCssFileToBe(layoutCssOutput, 'layout');

	testUtils.testHtmlFileToBe(indexHtmlOutput);
	testUtils.testHtmlFileToBe(layoutHtmlOutput, 'layout');
});
