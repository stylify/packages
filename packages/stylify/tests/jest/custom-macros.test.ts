import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'custom-macros';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	macros: {
		'zi:(\\S+?)': ({macroMatch, selectorProperties}) => {
			selectorProperties.addMultiple({
				'position': 'relative',
				'z-index': Number(macroMatch.getCapture(0))
			});
		}
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Single letter macros', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
