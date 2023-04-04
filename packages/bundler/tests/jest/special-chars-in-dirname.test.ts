import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'special-chars-in-dirname';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

new Bundler({ dev: true, showBundlesStats: false }).bundle([
	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [path.join(buildTmpDir, '\\\(themes\\)/**/*.{html,svelte}')]
	}
]);

test('Special chars in dirname', (): void => {
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
	testUtils.testCssFileToBe(indexCssOutput);
});
