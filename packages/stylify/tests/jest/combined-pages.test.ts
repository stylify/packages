import { SelectorsRewriter, Compiler, nativePreset } from '../../src';
import TestUtils from './TestUtils';

const testName = 'combined-pages';
const testUtils = new TestUtils(testName);

const inputIndex = testUtils.getInputFile('index.html');
const inputAbout = testUtils.getInputFile('about.html');

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);
compilationResult = compiler.compile(inputAbout, compilationResult);

test('Two HTML files build with selectors rewriter', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex));
	testUtils.testHtmlFileToBe(SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputAbout), 'about');
});
