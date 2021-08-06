import TestUtils from './TestUtils';
import { SelectorsRewriter, Compiler } from './../../lib';
import { nativePreset } from './../../lib/Presets';

const testName = 'dynamic-screens';
const testUtils = new TestUtils(testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
const compiler = new Compiler(nativePreset.compiler);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);

test('Dynamic screens', () => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex));
	testUtils.testJsonFileToBe(compilationResult.serialize());
});
