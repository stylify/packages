import TestUtils from './TestUtils';
import { SelectorsRewriter, Compiler } from './../../lib';
import { nativePreset } from './../../lib/Presets';

const testName = 'larger-page';
const testUtils = new TestUtils(testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);

test('Generated css, rewritten HTML', () => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex));
});
