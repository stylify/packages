import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'custom-macros';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;

nativePreset.compiler.macros['zi:(\\S+?)'] = function (macroMatch, cssProperties) {
	cssProperties.addMultiple({
		'position': 'relative',
		'z-index': Number(macroMatch.getCapture(0))
	});
};

const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Single letter macros', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
