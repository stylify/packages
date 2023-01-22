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

execSync(`cd ${buildTmpDir} && yarn install && yarn build`);

const frontFileContentPart = `n={class:"b a"};function _(s,r){return t(),c("h2",n,"Smaller Subtitle")}`;
const serverDefaultFileContentPart = '_push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "d e" }, _attrs))}><div class="f">This is layout</div>`);'

test('Nuxt - Stylify options', async (): Promise<void> => {
	const [cssFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'public', '_nuxt', 'entry.*.css'));
	const [subtitleFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'public', '_nuxt', 'SmallerSubtitle.*.js'));

	const cssFileContent = testUtils.readFile(cssFileEntry);
 	const frontFileContent = testUtils.readFile(subtitleFileEntry);

	testUtils.testCssFileToBe(cssFileContent, 'output');
	expect(frontFileContent.includes(frontFileContentPart)).toBeTruthy();
});
