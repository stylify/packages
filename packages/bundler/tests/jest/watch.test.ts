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
		watchFiles: true
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
		`
	)

	await bundler.bundle();

	bundler.stop();

	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
	testUtils.testCssFileToBe(indexCssOutput);
});
