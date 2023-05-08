/**
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import * as fg from 'fast-glob';
import { stylifyVite } from '../../src';
import { build } from 'vite'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'vite-default-transform';
const testUtils = new TestUtils('unplugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');


if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

test('Vite - with default transform', async (): Promise<void> => {
	const test = () => {
		let indexCssOutput = null;
		let mainJsOutput = null;
		let indexHtmlOutput = null;

		fg.sync([
			path.join(buildTmpDir, 'dist', 'assets', '*.css'),
			path.join(buildTmpDir, 'dist', 'assets', '*.js'),
			path.join(buildTmpDir, 'dist', '*.html'),
		]).forEach((filePath) => {
			const fileContent = testUtils.readFile(filePath);
			if (filePath.endsWith('css')) {
				indexCssOutput = fileContent;

			} else if (filePath.endsWith('js')) {
				mainJsOutput = fileContent;

			} else {
				indexHtmlOutput = fileContent;
			}
		});

		indexHtmlOutput = indexHtmlOutput.replace(/index-[^\.]+\.(css|js)/g, (fullMatch, fileType) => {
			return `index.${fileType}`;
		});

		testUtils.testHtmlFileToBe(indexHtmlOutput);
		testUtils.testCssFileToBe(indexCssOutput);
		testUtils.testJsFileToBe(mainJsOutput);
	}

	await build({
		root: buildTmpDir,
		logLevel: 'error',
		plugins: [
			stylifyVite({
				compiler: {
					mangleSelectors: true,
				},
				bundles: [{
					outputFile: path.join(buildTmpDir, 'index.css'),
					files: [path.join(buildTmpDir, 'index.html')]
				}],
				bundler: {
					showBundlesStats: false
				}
			})
		]
	});

	test();
});
