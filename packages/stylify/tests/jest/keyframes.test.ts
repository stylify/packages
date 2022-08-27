import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'keyframes';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.keyframes = {
	colorChangeFromTo: `
		from {background-color: red;}
		to {background-color: yellow;}
	`
};

const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Keyframes', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
