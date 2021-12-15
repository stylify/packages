import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'mangle-duplicate-selectors';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Duplicate selectors', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
