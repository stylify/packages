import TestUtils from '../../../../tests/TestUtils';
import { Compiler, minifiedSelectorGenerator } from '../../src';

const testName = 'aliases-escaping';
const testUtils = new TestUtils('stylify', testName);

beforeEach(() => minifiedSelectorGenerator.processedSelectors = {});

test('Aliases escaping', (): void => {
	const inputIndex = testUtils.getHtmlInputFile();

	const compiler = new Compiler({ dev: true });
	let compilationResult = compiler.compile(inputIndex);
	testUtils.testCssFileToBe(compilationResult.generateCss());
});

test('Aliases escaping - mangled', (): void => {
	const input = testUtils.getHtmlInputFile('mangled');

	const compiler = new Compiler({ dev: true, mangleSelectors: true });
	let compilationResult = compiler.compile(input);
	testUtils.testCssFileToBe(compilationResult.generateCss(), 'mangled');
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(input), 'mangled');
});
