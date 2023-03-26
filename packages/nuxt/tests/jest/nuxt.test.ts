import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'nuxt';
const testUtils = new TestUtils('nuxt', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`cd ${buildTmpDir} && npm install && npm run build`, {stdio: 'inherit'});

const frontFileContentPart = `{class:"b a"}`;
const serverDefaultFileContentPart = '_push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "d e" }, _attrs))}><div class="f">This is layout</div>`);'

test('Nuxt - Stylify options', async (): Promise<void> => {
	const [cssFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'public', '_nuxt', 'entry.*.css'));
	const indexFiles = FastGlob.sync(path.join(buildTmpDir, '.output', 'public', '_nuxt', 'index.*.js'));
	let jsFileTested = false;
	const cssFileContent = testUtils.readFile(cssFileEntry);

	for (const indexFile of indexFiles) {
		const frontFileContent = testUtils.readFile(indexFile);
		if (!frontFileContent.includes('Smaller Subtitle')) {
			continue;
		}
		expect(frontFileContent.includes(frontFileContentPart)).toBeTruthy();
		jsFileTested = true;
	}

	if (!jsFileTested) {
		throw new Error('Js file not tested.');
	}

	testUtils.testCssFileToBe(cssFileContent, 'output');
});
