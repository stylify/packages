import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'larger-page';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({ dev: true });
let compilationResult = compiler.compile(inputIndex);

test('Generated css, rewritten HTML', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
