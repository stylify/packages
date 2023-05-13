import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'content-options';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();


const compiler = new Compiler({
	dev: true
});

let compilationResult = compiler.compile(inputIndex);

test('Content options', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	expect(compiler.externalVariables.includes('color')).toBe(true);
});
