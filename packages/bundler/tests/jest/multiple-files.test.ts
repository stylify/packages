import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { Bundler } from '../../src'
import { nativePreset } from '@stylify/stylify';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'multiple-files';
const testUtils = new TestUtils('bundler', testName);

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

nativePreset.compiler.selectorsAreas = ['(?:^|\\s+)n:class="([^"]+)"', '(?:^|\\s+)v-bind:class="([^"]+)"'];

const bundler = new Bundler({
	compiler: nativePreset.compiler,
	filesBaseDir: bundleTestDir,
	verbose: false
});

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

bundler.bundle([
	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		compiler: {
			mangleSelectors: false
		},
		files: [
			path.join(bundleTestDir, 'input', 'index.html'),
			path.join(bundleTestDir, 'input', 'index', '**', '*.html')
		]
	},
	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		filesBaseDir: buildTmpDir,
		files: [
			path.join(buildTmpDir, 'second.html'),
		]
	}
]);

test('Bundler - recursive', () => {
	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.css'));
	testUtils.testCssFileToBe(indexCssOutput);
});

test('Bundler - options in file', async () => {
	const secondCssOutput = testUtils.readFile(path.join(buildTmpDir, 'second.css'));

	const secondIndexHtmlOutput = testUtils.readFile(path.join(buildTmpDir, 'second.html'));

	const secondHtmlHtmlOutput = testUtils.readFile(path.join(buildTmpDir, 'second', 'html.html'));
	const secondNetteOutput = testUtils.readFile(path.join(buildTmpDir, 'second', 'nette.latte'));
	const secondSymfonyOutput = testUtils.readFile(path.join(buildTmpDir, 'second', 'symfony.twig'));
	const secondVueOutput = testUtils.readFile(path.join(buildTmpDir, 'second', 'vue.vue'));
	const secondVueComponentOutput = testUtils.readFile(path.join(buildTmpDir, 'second', 'vuejs', 'component.vue'));

	testUtils.testCssFileToBe(secondCssOutput, 'second');

	testUtils.testHtmlFileToBe(secondIndexHtmlOutput, 'second');

	testUtils.testHtmlFileToBe(secondHtmlHtmlOutput, path.join('second', 'html'));
 	testUtils.testFileToBe(secondNetteOutput, 'latte', path.join('second', 'nette'));
	testUtils.testFileToBe(secondSymfonyOutput, 'twig', path.join('second', 'symfony'));
	testUtils.testFileToBe(secondVueOutput, 'vue', path.join('second', 'vue'));
	testUtils.testFileToBe(secondVueComponentOutput, 'vue', path.join('second', 'vuejs', 'component'));
});
