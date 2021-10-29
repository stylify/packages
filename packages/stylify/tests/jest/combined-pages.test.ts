import { Compiler, nativePreset } from '../../src';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'combined-pages';
const testUtils = new TestUtils('stylify', testName);

const inputIndex = testUtils.getInputFile('index.html');
const inputAbout = testUtils.getInputFile('about.html');

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);
compilationResult = compiler.compile(inputAbout, compilationResult);

test('Combined pages', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(compilationResult, inputIndex));
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(compilationResult, inputAbout), 'about');
});
