import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'plain-selectors';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	plainSelectors: {
		'*': 'box-sizing:border-box',
		'body': 'font-size:16px',
		'article h1': 'font-size:16px',
		'::selection': 'color:#fff',
		a: 'hover:color:red',
		'h2:hover': 'color:green'
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Plain selectors', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
