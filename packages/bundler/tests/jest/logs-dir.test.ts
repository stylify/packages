import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'logs-dir';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

new Bundler({ dev: true, logsDir: `${buildTmpDir}/logs`, sync: true }).bundle([
	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: path.join(buildTmpDir, 'index.html')
	}
]);

test('Bundler - Logs dir', async (): Promise<void> => {
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'logs', 'index-error.css'));
	const bundlerErrorsOutput = testUtils.readFile(path.join(buildTmpDir, 'logs', 'stylify-bundler-error.txt'));

	testUtils.testCssFileToBe(indexCssOutput, 'index-error');
	expect(bundlerErrorsOutput.includes('No bundle was processed')).toBe(true);
	expect(bundlerErrorsOutput.includes('Error: CssSyntaxError: <css input>:2:10')).toBe(true);
});
