import TestUtils from './TestUtils';
import { SelectorsRewriter, Compiler, nativePreset } from '../../src';

const testName = 'dynamic-screens';
const testUtils = new TestUtils(testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Dynamic screens', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(SelectorsRewriter.rewrite(compilationResult, compiler.selectorAttributes, inputIndex));
	testUtils.testJsonFileToBe(compilationResult.serialize());
});
