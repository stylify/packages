import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import { nativePreset } from '@stylify/stylify';
import type { CompilationResult, CssRecord } from '@stylify/stylify';
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
	compilerConfig: nativePreset.compiler,
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
	compilerConfig: nativePreset.compiler,
	verbose: false
}).bundle([
	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		mangleSelectors: true,
		scope: '#stylify-profiler',
		files: [
			path.join(buildTmpDir, 'second.html'),
		]
	}
]);

test('Bundler - single file', (): void => {
	const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'index.css')).toString();
	testUtils.testCssFileToBe(indexCssOutput);
});

test('Bundler - single file - with scope', (): void => {
	const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'second.css')).toString();
	testUtils.testCssFileToBe(indexCssOutput, 'second');

	const secondIndexHtmlOutput = fs.readFileSync(path.join(buildTmpDir, 'second.html')).toString();
	testUtils.testHtmlFileToBe(secondIndexHtmlOutput, 'second');
});
