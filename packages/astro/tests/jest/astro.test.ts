import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'astro';
const testUtils = new TestUtils('astro', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`cd ${buildTmpDir} && yarn install && yarn build`);

const indexHtmlPart = `
	<body class="c">
		<h1 class="d e f">Layout</h1>
		<h1 class="f">Hello World!</h1><h2 class="a b">Subtitle</h2>
	</body>
`.trim();

const secondHtmlPart = `
	<body class="c">
		<h1 class="d e f">Layout</h1>
		<h1 class="g">Hello World 2!</h1><h2 class="a b">Subtitle</h2>
	</body>
`.trim();

const cssFilePart = '.a{color:orange}.b{font-size:24px}.c{text-align:center}.d{font-size:48px}.e{margin-top:24px}.f{color:purple}.g{color:lightpurple}'

test('Astro build', async (): Promise<void> => {
 	const [indexHtmlFileEntry] = FastGlob.sync(path.join(buildTmpDir, 'dist', 'index.html'));
	const [secondHtmlFileEntry] = FastGlob.sync(path.join(buildTmpDir, 'dist', 'second', 'index.html'));
	const [cssFileEntry] = FastGlob.sync(path.join(buildTmpDir, 'dist', 'assets', '*.css'));

	const indexHtmlFileContent = testUtils.readFile(indexHtmlFileEntry);
	const secondHtmlFileContent = testUtils.readFile(secondHtmlFileEntry);
	const cssFileContent = testUtils.readFile(cssFileEntry);

	expect(indexHtmlFileContent.includes(indexHtmlPart)).toBeTruthy();
	expect(secondHtmlFileContent.includes(secondHtmlPart)).toBeTruthy();
	expect(cssFileContent.includes(cssFilePart)).toBeTruthy();
});
