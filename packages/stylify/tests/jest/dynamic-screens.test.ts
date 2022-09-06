import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'dynamic-screens';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({ dev: true });
let compilationResult = compiler.compile(inputIndex);

test('Dynamic screens', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
