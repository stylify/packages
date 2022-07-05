import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import { nativePreset } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'single-file';
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
	verbose: false
}).bundle([
   	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [
			path.join(buildTmpDir, 'index.html'),
		]
	}
]);

new Bundler({
	compiler: nativePreset.compiler,
	verbose: false
}).bundle([
	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		scope: '#stylify-profiler ',
		files: [
			path.join(buildTmpDir, 'second.html'),
		]
	}
]);

test('Bundler - single file', (): void => {
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
	testUtils.testCssFileToBe(indexCssOutput);
});

test('Bundler - single file - with scope', (): void => {
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'second.css'));
	testUtils.testCssFileToBe(indexCssOutput, 'second');
});
