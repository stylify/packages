import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'mangle-single-letter-macros';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	mangleSelectors: true,
	macros: {
		'm:(\\S+?)': (macroMatch, cssProperties) => {
			cssProperties.add('margin', macroMatch.getCapture(0));
		}
	}
});
let compilationResult = compiler.compile(inputIndex);

test('Mangle single letter macros', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
