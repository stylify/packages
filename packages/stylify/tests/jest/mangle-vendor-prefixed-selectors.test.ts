import TestUtils from '../../../../tests/TestUtils';
import { Compiler, nativePreset } from '../../src';

const testName = 'mangle-vendor-prefixed-selectors';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
nativePreset.compiler.selectorsAreas =  [
	// Vue.js
	'(?:^|\\s+)(?:v-bind)?:class="([^"]+)"',
	// React
	'(?:^|\\s+)className="([^"]+)"', '(?:^|\\s+)className=\\{`((?:.|\n)+?)`\\}',
	// Angular
	'(?:^|\\s+)[className]="([^"]+)"', '(?:^|\\s+)[ngClass]="{((?:.|\n)+?)}"',
	// Nette framework
	'(?:^|\\s+)n:class="([^"]+)"'
	// ...
];

const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.compile(inputIndex);

test('Mangle vendor prefixed selectors', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
});