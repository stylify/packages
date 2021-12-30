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
	verbose: false
});

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

bundler.bundle([
  	{
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [
			path.join(bundleTestDir, 'input', 'index.html'),
			path.join(bundleTestDir, 'input', 'index', '**', '*.html')
		]
	},
   	{
		outputFile: path.join(buildTmpDir, 'second.css'),
		mangleSelectors: true,
		cache: fs.readFileSync(path.join(bundleTestDir, 'input', 'second.css.json')).toString(),
		dumpCache: true,
		files: [
			path.join(buildTmpDir, 'second.html'),
		]
	}
]);

test('Bundler - recursive', () => {
	const indexCssOutput = fs.readFileSync(path.join(buildTmpDir, 'index.css')).toString();
	testUtils.testCssFileToBe(indexCssOutput);
});

test('Bundler - options in file', () => {
	const secondCssOutput = fs.readFileSync(path.join(buildTmpDir, 'second.css')).toString();

	const secondIndexHtmlOutput = fs.readFileSync(path.join(buildTmpDir, 'second.html')).toString();
 	const secondNetteOutput = fs.readFileSync(path.join(buildTmpDir, 'second', 'nette.latte')).toString();
	const secondSymfonyOutput = fs.readFileSync(path.join(buildTmpDir, 'second', 'symfony.twig')).toString();
	const secondVueOutput = fs.readFileSync(path.join(buildTmpDir, 'second', 'vue.vue')).toString();
	const secondVueComponentOutput = fs.readFileSync(path.join(buildTmpDir, 'second', 'vuejs', 'component.vue')).toString();

	testUtils.testCssFileToBe(secondCssOutput, 'second');

	testUtils.testHtmlFileToBe(secondIndexHtmlOutput, 'second');
   	testUtils.testFileToBe(secondNetteOutput, 'latte', path.join('second', 'nette'));
	testUtils.testFileToBe(secondSymfonyOutput, 'twig', path.join('second', 'symfony'));
	testUtils.testFileToBe(secondVueOutput, 'vue', path.join('second', 'vue'));
	testUtils.testFileToBe(secondVueComponentOutput, 'vue', path.join('second', 'vuejs', 'component'));
});


