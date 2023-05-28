import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'nuxt';
const testUtils = new TestUtils('nuxt-module', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`cd ${buildTmpDir} && npm install && npm run build`);

const indexPageContentPart = 'staticClass: "h g"'.trim();

const smallerSubtitleComponentPart = 'staticClass: "h g"'.trim();

const subtitleComponentPart = 'staticClass: "h"'.trim();

const serverFilePart = `
___CSS_LOADER_EXPORT___.push([module.i, ":root{--red:darkred;--blue:#00008b;--green:#006400;--yellow:#ff0}.c{color:darkred;color:var(--red)}.f{color:#006400;color:var(--green)}.h{color:#00008b;color:var(--blue)}.b{font-size:24px}.g{font-size:12px}.e{margin:0 auto}.d{max-width:640px}.a{text-align:center}", ""]);
`.trim();

const serverFilePart2 = 'staticClass: "d e"';

test('Nuxt - Stylify options', async (): Promise<void> => {
	const [serverFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.nuxt', 'dist', 'server', 'server.js'));
	const [smallSubtitleComponentFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.nuxt', 'dist', 'server', 'components', 'smaller-subtitle.js'));
	const [subtitleComponentFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.nuxt', 'dist', 'server', 'components', 'subtitle.js'));
	const [indexPageFileEntry] = FastGlob.sync(path.join(buildTmpDir, '.nuxt', 'dist', 'server', 'pages', 'index.js'));

	const serverFileContent = testUtils.readFile(serverFileEntry);
	const smallSubtitleComponentFileContent = testUtils.readFile(smallSubtitleComponentFileEntry);
	const subtitleComponentFileContent = testUtils.readFile(subtitleComponentFileEntry);
	const indexPageFileContent = testUtils.readFile(indexPageFileEntry);

	expect(serverFileContent.includes(serverFilePart)).toBeTruthy();
	expect(serverFileContent.includes(serverFilePart2)).toBeTruthy();

	expect(subtitleComponentFileContent.includes(subtitleComponentPart)).toBeTruthy();
	expect(smallSubtitleComponentFileContent.includes(smallerSubtitleComponentPart)).toBeTruthy();
	expect(indexPageFileContent.includes(indexPageContentPart)).toBeTruthy();
});
