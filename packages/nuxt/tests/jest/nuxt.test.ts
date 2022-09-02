import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import { nativePreset } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'nuxt';
const testUtils = new TestUtils('nuxt', testName);

nativePreset.compiler.dev = true;

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`cd ${buildTmpDir} && yarn install && yarn build`);

const frontFileContentPart = `const l={},i={class:"h"};function d(n,_){return t(),c("h2",i,"Subtitle")}const u=e(l,[["render",d]]),f={},m={class:"h g"};function h(n,_){return t(),c("h2",m,"Smaller Subtitle")}const p=e(f,[["render",h]]),x={},b=a("h1",{class:"a b c"},"Test title",-1);function $(n,_){const o=u,r=p;return t(),c("div",null,[b,s(o),s(r)])}const S=e(x,[["render",$]]);export{S as default};`;
const serverFileContentPart = '_push(`<h2${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "h g" }, _attrs))}>Smaller Subtitle</h2>`);';
const serverFileContentPart2 = '_push(`<h2${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "h" }, _attrs))}>Subtitle</h2>`);'
const serverDefaultFileContentPart = '_push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "d e" }, _attrs))}><div class="f">This is layout</div>`);'

test('Nuxt - Stylify options', async (): Promise<void> => {
	const [cssFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'public', '_nuxt', 'entry.*.css'));
	const [frontFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'public', '_nuxt', 'index.*.mjs'));
	const [serverFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'server', 'chunks', 'app', 'server.mjs'));
	const [serverDefaultFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.output', 'server', 'chunks', 'app', '_nuxt', 'default.*.mjs'));

	const cssFileContent = testUtils.readFile(cssFileEntry);
	const frontFileContent = testUtils.readFile(frontFileEntry);
	const serverFileContent = testUtils.readFile(serverFileEntry);
	const serverDefaultFileContent = testUtils.readFile(serverDefaultFileEntry);

	testUtils.testCssFileToBe(cssFileContent, 'output');
	expect(frontFileContent.includes(frontFileContentPart)).toBeTruthy();

	expect(serverFileContent.includes(serverFileContentPart)).toBeTruthy();
	expect(serverFileContent.includes(serverFileContentPart2)).toBeTruthy();

	expect(serverDefaultFileContent.includes(serverDefaultFileContentPart)).toBeTruthy();
});
