import TestUtils from './TestUtils';
import { SelectorsRewriter, Compiler, nativePreset } from '../../src';

const testName = 'deserialize';
const testUtils = new TestUtils(testName);
const inputIndex = testUtils.getHtmlInputFile();
const inputJsonFile = testUtils.getJsonInputFile();

nativePreset.compiler.dev = true;
const compiler = new Compiler(nativePreset.compiler);
const compilationResultFromSerializedData = compiler.createResultFromSerializedData(inputJsonFile);
const cssFromCompilationResultWithSerializedData = compilationResultFromSerializedData.generateCss();
let compilationResult = compiler.compile(inputIndex, compilationResultFromSerializedData);


test('Deserialize', (): void => {
	testUtils.testCssFileToBe(cssFromCompilationResultWithSerializedData, 'from-serialized');
	testUtils.testCssFileToBe(compilationResult.generateCss(), 'combined');
	testUtils.testHtmlFileToBe(SelectorsRewriter.rewrite(compilationResult, compiler.selectorAttributes, inputIndex));
	testUtils.testJsonFileToBe(compilationResult.serialize());
});
