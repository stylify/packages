import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'ignored-areas';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;

const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Ignored areas', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
