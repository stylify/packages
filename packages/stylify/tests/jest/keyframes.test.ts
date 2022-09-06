import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'keyframes';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	keyframes: {
		colorChangeFromTo: `
			from {background-color: red;}
			to {background-color: yellow;}
		`
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Keyframes', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
