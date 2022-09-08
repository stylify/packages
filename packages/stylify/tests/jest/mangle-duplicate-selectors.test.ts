import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'mangle-duplicate-selectors';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({ mangleSelectors: true });
let compilationResult = compiler.compile(inputIndex);

test('Duplicate selectors', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
