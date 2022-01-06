/**
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { webpack }  from 'webpack'
import { StylifyWebpackPlugin } from '../../src';
import type { MacroMatch, SelectorProperties } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'single-file-bundle';
const testUtils = new TestUtils('webpack-plugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');


if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

const compiler = webpack({
	entry: path.join(buildTmpDir, 'index.js'),
	mode: 'development',
	plugins: [
		new StylifyWebpackPlugin({
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
		libraryTarget: 'umd'
	}
});


test('Single file bundle', (done): void => {
	const test = () => {
		const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'index.css')).toString();
		const mainJsOutput =  fs.readFileSync(path.join(buildTmpDir, 'main.js')).toString();
		testUtils.testCssFileToBe(indexCssOutput);
		testUtils.testJsFileToBe(mainJsOutput, 'main');
		done();
	}

	compiler.run(() => {
		compiler.close(test);
	});
});
