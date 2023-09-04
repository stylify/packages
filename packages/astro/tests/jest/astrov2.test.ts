import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'astrov2';
const testUtils = new TestUtils('astro', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`pnpm install . && pnpm build .`, {stdio: 'inherit', cwd: buildTmpDir});

const indexHtmlPart1 = `<body class="e f"><h1 class="g h i">Layout</h1>`.trim();

const indexHtmlPart2 = `<h1 class="i">Hello World!</h1><h2 class="l j m k"></h2><h3 class="g">Another text</h3><h2 class="a b">Subtitle</h2>`.trim();

const indexHtmlPart3 = `<strong class=" c d ">`.trim()

const secondHtmlPart1 = `<body class="e f"><h1 class="g h i">Layout</h1>`.trim();

const secondHtmlPart2 = `<h1 class="n">Hello World 2!</h1><h2 class="a b">Subtitle</h2>`.trim();

const secondHtmlPart3 = `<strong class=" c d ">`

const cssFilePart = ':root{--blue: darkblue}.a{color:orange}.c{color:test}.f{color:#00008b}.i{color:purple}.n{color:lightpurple}.b{font-size:24px}.d{font-size:123px}.g{font-size:48px}.m{font-size:12px}.l{font-weight:700}.h{margin-top:24px}.e{text-align:center}@media (min-width: 1024px){.j{color:darkpurple}.k{font-size:24px}}';

test('Astro v2', async (): Promise<void> => {
 	const [indexHtmlFileEntry] = FastGlob.sync(path.join(buildTmpDir, 'dist', 'index.html'));
	const [secondHtmlFileEntry] = FastGlob.sync(path.join(buildTmpDir, 'dist', 'second', 'index.html'));

	const indexHtmlFileContent = testUtils.readFile(indexHtmlFileEntry);
	const secondHtmlFileContent = testUtils.readFile(secondHtmlFileEntry);

	expect(indexHtmlFileContent.includes(indexHtmlPart1)).toBeTruthy();
	expect(indexHtmlFileContent.includes(indexHtmlPart2)).toBeTruthy();
	expect(indexHtmlFileContent.includes(indexHtmlPart3)).toBeTruthy();
	expect(indexHtmlFileContent.includes(cssFilePart)).toBeTruthy();

	expect(secondHtmlFileContent.includes(secondHtmlPart1)).toBeTruthy();
	expect(secondHtmlFileContent.includes(secondHtmlPart2)).toBeTruthy();
	expect(secondHtmlFileContent.includes(secondHtmlPart3)).toBeTruthy();
	expect(secondHtmlFileContent.includes(cssFilePart)).toBeTruthy();
});
