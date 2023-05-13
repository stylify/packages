/**
 * @jest-environment node
 */
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import esbuild from 'esbuild';
import { stylifyEsbuild } from '../../src';

const testName = 'esbuild';
const testUtils = new TestUtils('unplugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

async function build() {
	await esbuild.build({
		entryPoints: [path.join(buildTmpDir, 'index.js')],
		bundle: true,
		outfile: path.join(buildTmpDir, 'output.js'),
		plugins: [
			stylifyEsbuild({
				dev: false,
				bundles: [
					{
						outputFile: path.join(buildTmpDir, 'index.css'),
						files: [path.join(buildTmpDir, 'index.html')]
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
			})
		]
	});
}

test('ESbuild', async (): Promise<void> => {
	const runTest = () => {
		const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
		const mainJsOutput = testUtils.readFile(path.join(buildTmpDir, 'output.js'));
		testUtils.testCssFileToBe(indexCssOutput);
		testUtils.testJsFileToBe(mainJsOutput, 'output');
	}

	await build();
	runTest();
});
