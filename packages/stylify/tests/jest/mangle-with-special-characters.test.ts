import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'mangle-with-special-characters';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	mangleSelectors: true
});

let compilationResult = compiler.compile(inputIndex);

/**
 * This test is here, because dollars were removed when content was mangled. It is becuase $$ is replaced by $
 * and it broke some of the functionality in some codes when mangled.
 */
test('Mangle with special characters - dollars should stay as they are and non should removed.', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex));
});
