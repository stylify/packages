import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'custom-selectors';
const testUtils = new TestUtils('stylify', testName);

const customSelectorsSet = {
	'*': 'box-sizing:border-box',
	'body': 'font-size:16px',
	'article h1': 'font-size:16px',
	'::selection': 'color:#fff',
	a: 'hover:color:red',
	'h2:hover': 'color:green'
}

test('Custom selectors - only set', (): void => {
	const compiler = new Compiler({
		dev: true,
		customSelectors: customSelectorsSet
	});

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile());

	testUtils.testCssFileToBe(compilationResult.generateCss());
});
