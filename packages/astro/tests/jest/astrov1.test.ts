import path from 'path';
import FastGlob from 'fast-glob';
import fs from 'fs';
import fse from 'fs-extra';
import TestUtils from '../../../../tests/TestUtils';
import { execSync } from 'child_process';

const testName = 'astrov1';
const testUtils = new TestUtils('astro', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

execSync(`pnpm install . && pnpm build .`, {stdio: 'inherit', cwd: buildTmpDir});

const indexHtmlPart = `
	<body class="c d">
		<h1 class="e f g">Layout</h1>
		<h1 class="g">Hello World!</h1><h2 class="j h k i"></h2><h3 class="e">Another text</h3><h2 class="a b">Subtitle</h2>
	</body></html>
`.trim();

const secondHtmlPart = `
	<body class="c d">
		<h1 class="e f g">Layout</h1>
		<h1 class="l">Hello World 2!</h1><h2 class="a b">Subtitle</h2>
	</body></html>
`.trim();

const cssFilePart = ':root{--blue: darkblue}.a{color:orange}.d{color:#00008b}.g{color:purple}.l{color:lightpurple}.b{font-size:24px}.e{font-size:48px}.k{font-size:12px}.j{font-weight:700}.f{margin-top:24px}.c{text-align:center}@media (min-width: 1024px){.h{color:darkpurple}.i{font-size:24px}}';

test('Astro v1', async (): Promise<void> => {
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
