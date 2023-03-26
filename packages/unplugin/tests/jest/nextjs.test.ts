import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'nextjs';
const testUtils = new TestUtils('unplugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`cd ${buildTmpDir} && npm i && npm run build`);

test('Next - prod build', async (): Promise<void> => {
	const [cssFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.next', 'static', 'css', '*.css'));
	const [indexFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.next', 'static', 'chunks', 'pages', 'index-*.js'));

	const cssFileContent = testUtils.readFile(cssFileEntry);
	const indexFileContent = testUtils.readFile(indexFileEntry);

	testUtils.testCssFileToBe(cssFileContent);
	expect(indexFileContent.includes('"h1",{className:"a",children:"Hello World!"')).toBeTruthy();
});
