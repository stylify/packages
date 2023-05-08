import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'vars-export';
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
	filesBaseDir: buildTmpDir,
	sassVarsExportPath: 'css',
	stylusVarsExportPath: 'css/stylus-vars.styl',
	cssVarsExportPath: 'css/nested/css.css',
	compiler: {
		variables: {
			blue: 'steelblue',
			red: 'darkred'
		}
	}
}).bundle([
	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [
			path.join(buildTmpDir, 'index.html'),
		]
	}
]);

test('Vars export', (): void => {
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));

	expect(fs.existsSync(path.join(buildTmpDir, 'stylify-variables.scss'))).toBeTruthy();
	expect(fs.existsSync(path.join(buildTmpDir, 'css', 'stylus-vars.styl'))).toBeTruthy();
	expect(fs.existsSync(path.join(buildTmpDir, 'css', 'nested', 'css.css'))).toBeTruthy();
});
