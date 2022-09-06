import { Compiler } from '../../src';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'combined-pages';
const testUtils = new TestUtils('stylify', testName);

const inputIndex = testUtils.getInputFile('index.html');
const inputAbout = testUtils.getInputFile('about.html');

const compiler = new Compiler({ dev: true, mangleSelectors: true });

let compilationResult = compiler.compile(inputIndex);
compilationResult = compiler.compile(inputAbout, compilationResult);

test('Combined pages', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputAbout, compilationResult), 'about');
});
