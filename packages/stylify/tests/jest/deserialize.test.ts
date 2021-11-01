import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';
import util from 'util';

const testName = 'deserialize';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();
const inputJsonFile = testUtils.getJsonInputFile();

nativePreset.compiler.dev = true;
const compiler = new Compiler(nativePreset.compiler);
const compilationResultFromSerializedData = compiler.createCompilationResultFromSerializedData(inputJsonFile);
const cssFromCompilationResultWithSerializedData = compilationResultFromSerializedData.generateCss();
let compilationResult = compiler.compile(inputIndex, compilationResultFromSerializedData);

test('Deserialize', (): void => {
	testUtils.testCssFileToBe(cssFromCompilationResultWithSerializedData, 'from-serialized');
	testUtils.testCssFileToBe(compilationResult.generateCss(), 'combined');
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(compilationResult, inputIndex));
	testUtils.testJsonFileToBe(compilationResult.serialize());
});
