import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'vite-react';
const testUtils = new TestUtils('unplugin', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(
	`cd ${buildTmpDir} && npm install && npm run build`
	//,{stdio: 'inherit'}
);

const jsFileContentPart = `Hu("div",{className:"a",children:[Hu("div",{className:"b",children:"Hello World! 🎉"}`.trim();
const jsFileContentPart2 = `{className:\`
				e
			\``;

test('Vite - React', async (): Promise<void> => {
	const [jsFileEntry] = FastGlob.sync(`${buildTmpDir}/dist/assets/*.js`);
	const [cssFileEntry] = FastGlob.sync(`${buildTmpDir}/dist/assets/*.css`);

	const cssFileContent = testUtils.readFile(cssFileEntry);
	const jsFileContent = testUtils.readFile(jsFileEntry);

	testUtils.testCssFileToBe(cssFileContent, 'output');
	expect(jsFileContent.includes(jsFileContentPart)).toBeTruthy();
	expect(/className:(?:"|`)\s*e\s*(?:"|`)/.test(jsFileContent)).toBeTruthy();
});
