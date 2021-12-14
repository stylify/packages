import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'components';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
const compiler = new Compiler(nativePreset.compiler);
compiler.configure({
	components: {
		'button': 'padding:8px background-color:#000 display:inline-block font-size:24px hover:color:blue',
		'button--big': {
			selectors: 'padding:12px font-size:24px',
			selectorsChain: 'button'
		},
		'container': `max-width:800px margin:0__auto`,
		'title': ['font-size:24px', 'color:green', 'font-size:24px md:font-size:32px'],
		'not-used': ['color:steelblue'],
	}
});
let compilationResult = compiler.compile(inputIndex);

test('Components', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
