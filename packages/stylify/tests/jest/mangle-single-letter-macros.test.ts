import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'mangle-single-letter-macros';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
nativePreset.compiler.macros['m:(\\S+?)'] = function (macroMatch, cssProperties) {
	cssProperties.add('margin', macroMatch.getCapture(0));
};

const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Mangle single letter macros', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
