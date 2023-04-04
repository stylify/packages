import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'bundle-specific-compiler-config';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

new Bundler({
	dev: true,
	showBundlesStats: false,
	compiler: {
		variables: {
			red: 'darkred',
			blue: 'steelblue'
		}
	}
}).bundle([
	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		compiler: {
			replaceVariablesByCssVariables: true,
			components: {
				button: 'background:blue color:white'
			},
			macros: {
				'm:(\\S+?)': ({macroMatch, selectorProperties}): void => {
					selectorProperties.add('margin', macroMatch.getCapture(0));
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
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
	const secondCssOutput = testUtils.readFile(path.join(buildTmpDir, 'second.css'));

	testUtils.testCssFileToBe(indexCssOutput);
	testUtils.testCssFileToBe(secondCssOutput, 'second');
});
