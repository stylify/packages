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
	compiler: nativePreset.compiler,
	verbose: false
}).bundle([
   	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		compiler: {
			replaceVariablesByCssVariables: true,
			components: {
				button: 'background:blue color:white'
			},
			macros: {
				'm:(\\S+?)': function (macroMatch, cssProperties): void {
					cssProperties.add('margin', macroMatch.getCapture(0));
				},
			},
		},
		files: [
			path.join(buildTmpDir, 'index.html'),
		]
	},
 	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		compiler: {
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
