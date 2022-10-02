import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'components';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	components: {
		'button': 'padding:8px background-color:#000 display:inline-block font-size:24px hover:color:blue',
		'button--big': `
			.button& {
				padding:12px font-size:24px
			}
		`,
		'container_wrapper': 'padding:4px',
		'container': 'max-width:800px margin:0_auto',
		'title': `font-size:24px color:green font-size:24px md:font-size:32px`,
		'not-used': 'color:steelblue',
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Components', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
