import TestUtils from '../../../../tests/TestUtils';
import { Compiler } from '../../src';

const testName = 'components-mangle-selectors';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	mangleSelectors: true,
	components: {
		'button': 'padding:8px background-color:#000 display:inline-block font-size:24px',
		'container': `max-width:800px margin:0_auto`,
		'title': ['font-size:24px', 'color:green', 'font-size:24px md:font-size:32px'],
		'not-used': ['color:steelblue']
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Components - mangle selectors', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
