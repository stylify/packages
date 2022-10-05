/**
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { stylifyRollup } from '../../src';
import type { MacroMatch, SelectorProperties } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';
import { rollup } from 'rollup';
import postcss from 'rollup-plugin-postcss';

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
				transformIncludeFilter(id) {
					return id.endsWith('html');
				},
				dev: false,
				bundles: [
					{
						outputFile: path.join(buildTmpDir, 'index.css'),
						files: [path.join(buildTmpDir, 'index.html')]
					}
				],
				bundler: {
					compiler: {
						variables: {
							blue: 'steelblue'
						},
						macros: {
							'm:(\\S+?)': (m: MacroMatch, p: SelectorProperties) => {
								p.add('margin', m.getCapture(0));
							}
						}
					}
				}
			}),
			postcss()
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
