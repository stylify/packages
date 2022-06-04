/**
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { webpack }  from 'webpack'
import { webpackPlugin } from '../../src';
import type { MacroMatch, SelectorProperties } from '@stylify/stylify';
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
			const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'index.css')).toString();
			const mainJsOutput =  fs.readFileSync(path.join(buildTmpDir, 'main.js')).toString();

			testUtils.testCssFileToBe(indexCssOutput);
			testUtils.testJsFileToBe(mainJsOutput, 'main');
			resolve();
		}

		const compiler = webpack({
			entry: path.join(buildTmpDir, 'index.js'),
			mode: 'production',
			plugins: [
				webpackPlugin({
					transformIncludeFilter(id) {
						return id.endsWith('html');
					},
					bundles: [
						{
							outputFile: path.join(buildTmpDir, 'index.css'),
							files: [path.join(buildTmpDir, 'index.html')]
						}
					],
					extend: {
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

		compiler.run(() => compiler.close(test));
	});
});
