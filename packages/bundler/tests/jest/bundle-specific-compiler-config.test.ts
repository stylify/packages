import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import { nativePreset } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'bundle-specific-compiler-config';
const testUtils = new TestUtils('bundler', testName);

nativePreset.compiler.variables = {
	red: 'darkred',
	blue: 'steelblue'
};
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
		compilerConfig: {
			replaceVariablesByCssVariables: true
		},
		files: [
			path.join(buildTmpDir, 'index.html'),
		]
	},
	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		compilerConfig: {
			injectVariablesIntoCss: false
		},
		files: [
			path.join(buildTmpDir, 'second.html'),
		]
	}
]);

test('Bundler - single file', (): void => {
	const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'index.css')).toString();
	const secondCssOutput = fs.readFileSync(path.join(buildTmpDir, 'second.css')).toString();

	testUtils.testCssFileToBe(indexCssOutput);
	testUtils.testCssFileToBe(secondCssOutput, 'second');
});
