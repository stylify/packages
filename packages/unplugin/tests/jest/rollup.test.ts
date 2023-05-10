/**
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { stylifyRollup } from '../../src';
import TestUtils from '../../../../tests/TestUtils';
import { rollup } from 'rollup';
import css from 'rollup-plugin-import-css';

const testName = 'rollup';
const testUtils = new TestUtils('unplugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

async function build() {
	const bundle = await rollup({
		input: path.join(buildTmpDir, 'index.js'),
		plugins: [
			stylifyRollup({
				dev: false,
				compiler: {
					mangleSelectors: true,
				},
				bundles: [
					{
						outputFile: path.join(buildTmpDir, 'index.css'),
						files: [
							path.join(buildTmpDir, 'index.html'),
							path.join(buildTmpDir, 'index.js')
						]
					}
				],
				bundler: {
					showBundlesStats: false,
					compiler: {
						variables: {
							blue: 'steelblue'
						},
						cssVariablesEnabled: false,
						macros: {
							'm:(\\S+?)': (match) => {
								return {'margin': match.getCapture(0)};
							}
						}
					}
				}
			}),
			css()
		]
	});
	await bundle.write({
		file: path.join(buildTmpDir, 'main.js'),
		format: 'esm',
	});
	await bundle.close();
}

test('Rollup', async (): Promise<void> => {
	const runTest = () => {
		const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
		const mainJsOutput = testUtils.readFile(path.join(buildTmpDir, 'main.js'));
		testUtils.testCssFileToBe(indexCssOutput);
		testUtils.testJsFileToBe(mainJsOutput, 'main');
	}

	await build();
	runTest();
});
