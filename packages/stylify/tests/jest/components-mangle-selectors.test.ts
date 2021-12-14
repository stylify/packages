import TestUtils from '../../../../tests/TestUtils';
import { CompilationResult, Compiler, nativePreset } from '../../src';
import fs from 'fs';

const testName = 'components-mangle-selectors';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
compiler.configure({
	components: {
		'button': 'padding:8px background-color:#000 display:inline-block font-size:24px',
		'container': `max-width:800px margin:0__auto`,
		'title': ['font-size:24px', 'color:green', 'font-size:24px md:font-size:32px'],
		'not-used': ['color:steelblue']
	}
});
let compilationResult = compiler.compile(inputIndex);

test('Components - mangle selectors', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});
