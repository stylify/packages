import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'larger-page';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Generated css, rewritten HTML', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(compilationResult, inputIndex));
});
