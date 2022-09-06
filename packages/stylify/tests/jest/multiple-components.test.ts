import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'multiple-components';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	components: {
		'button, title': 'font-size:24px padding:24px',
		'button, wrapper': ['background:blue'] ,
		'title, wrapper': {
			selectors: 'display:flex justify-content:space-between',
			selectorsChain: ['header   button']
		},
		'title': {
			selectors: ['color:red'],
			selectorsChain: ''
		},
		'button': ['margin:11px'],
		'wrapper': 'outline:none',
		'not-used': ['color:steelblue'],
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Multiple components', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
