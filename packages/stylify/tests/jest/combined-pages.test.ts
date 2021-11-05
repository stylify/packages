import { Compiler, nativePreset } from '../../src';
import TestUtils from '../../../../tests/TestUtils';
import fs from 'fs';

const testName = 'combined-pages';
const testUtils = new TestUtils('stylify', testName);

const inputIndex = testUtils.getInputFile('index.html');
const inputAbout = testUtils.getInputFile('about.html');

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
let compilationResult = compiler.createCompilationResultFromSerializedData(
	testUtils.getJsonInputFile('serialized-compilation-result')
);
compilationResult = compiler.compile(inputIndex, compilationResult);
compilationResult = compiler.compile(inputAbout, compilationResult);

test('Combined pages', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputIndex, compilationResult));
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputAbout, compilationResult), 'about');
});
