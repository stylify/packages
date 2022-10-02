import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'ignored-areas';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({ dev: true, mangleSelectors: true });
let compilationResult = compiler.compile(inputIndex);

test('Ignored areas', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex));
});
