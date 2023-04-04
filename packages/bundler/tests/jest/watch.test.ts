import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'watch';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

test('Watch test - dynamic change', async (): Promise<void> => {

	let bundler: Bundler|null =  new Bundler({
		dev: true,
		showBundlesStats: false,
		watchFiles: true,
		configFile: `${buildTmpDir}/stylify.config.js`
	});

	bundler.bundle([
		{
			outputFile: path.join(buildTmpDir, 'index.css'),
			files: [
				path.join(buildTmpDir, 'index.html'),
			]
		}
	]);

	await bundler.waitOnBundlesProcessed();

	fs.writeFileSync(
		`${buildTmpDir}/index.html`,
		`
			<!--
			stylify-components
				container: 'color:blue'
			/stylify-components
			-->
			<div class="container color:blue"></div>
			<div class="font-size:$fontSize"></div>
		`
	)

	await bundler.bundle();

	const beforeConfigModification = testUtils.readFile(path.join(buildTmpDir, 'index.css'));

	fs.writeFileSync(
		`${buildTmpDir}/stylify.config.js`,
		`
			export default {
				compiler: {
					variables: {
						fontSize: '32px'
					}
				}
			};
		`
	);

	jest.resetModules();

	await bundler.restart();

	bundler.stop();

	const afterConfigModification = testUtils.readFile(path.join(buildTmpDir, 'index.css'));

	testUtils.testCssFileToBe(beforeConfigModification, 'before-config-modification');
	testUtils.testCssFileToBe(afterConfigModification, 'after-config-modification');
});
