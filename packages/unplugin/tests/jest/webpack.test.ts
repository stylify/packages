/**
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { webpack }  from 'webpack'
import { stylifyWebpack } from '../../src';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'webpack';
const testUtils = new TestUtils('unplugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

test('Webpack', async (): Promise<void> => {
	return new Promise((resolve) => {
		const test = () => {
			const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
			const mainJsOutput =  testUtils.readFile(path.join(buildTmpDir, 'main.js'));

			testUtils.testCssFileToBe(indexCssOutput);
			testUtils.testJsFileToBe(mainJsOutput, 'main');
			resolve();
		}

		const compiler = webpack({
			entry: path.join(buildTmpDir, 'index.js'),
			mode: 'production',
			plugins: [
				stylifyWebpack({
					bundles: [
						{
							outputFile: path.join(buildTmpDir, 'index.css'),
							files: [path.join(buildTmpDir, 'index.html')]
						}
					],
					bundler: {
						showBundlesStats: false,
						compiler: {
							mangleSelectors: true,
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
			],
			context: path.normalize(buildTmpDir),
			module: {
				rules: [
					{
						test: /\.css$/i,
						use: ['style-loader', 'css-loader']
					}
				]
			},
			output: {
				path: path.normalize(buildTmpDir),
				filename: 'main.js',
				libraryTarget: 'commonjs-module'
			}
		});

		compiler.run(() => {
			test();
		});
	});
});
