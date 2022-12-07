import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'css-layers';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

new Bundler({
	dev: true,
	cssLayersOrder: {
		order: ['layout', 'page'].join(','),
		exportLayer: ['layout'],
		exportFile: path.join(buildTmpDir, 'stylify-css-layers.css')
	}
}).bundle([
	{
		outputFile: path.join(buildTmpDir, 'layout.css'),
		files: [ path.join(buildTmpDir, 'layout.html') ],
		cssLayer: 'layout'
	},
	{
		outputFile: path.join(buildTmpDir, 'page.css'),
		files: [ path.join(buildTmpDir, 'page.html') ],
		cssLayer: 'page'
	},
]);

test('Bundler - single file', (): void => {
	const layoutCssOutput = testUtils.readFile(path.join(buildTmpDir, 'layout.css'));
	const pageCssOutput = testUtils.readFile(path.join(buildTmpDir, 'page.css'));
	const layersCssOutput = testUtils.readFile(path.join(buildTmpDir, 'stylify-css-layers.css'));

	testUtils.testCssFileToBe(layoutCssOutput, 'layout');
	testUtils.testCssFileToBe(pageCssOutput, 'page');
	testUtils.testCssFileToBe(layersCssOutput, 'stylify-css-layers');
});
