import TestUtils from './TestUtils';
import { Compiler } from '@stylify/stylify';
import { nativePreset, HooksManager } from '@stylify/stylify';
import { Prefixer, PrefixesGenerator } from '../../lib';

const prefixesGenerator = new PrefixesGenerator();
const testName = 'prefixer';
const testUtils = new TestUtils(testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;

// Simulate server side prefixes pregenerating
const serverCompiler = new Compiler(nativePreset.compiler);
let serverCompilationResult = serverCompiler.compile(inputIndex);
const prefixesMap = prefixesGenerator.createPrefixesMap(serverCompilationResult);

// Simulate in browser or SSR prefixing
const compiler = new Compiler(nativePreset.compiler);
new Prefixer(HooksManager, prefixesMap);
let compilationResult = compiler.compile(inputIndex);

test('Generated css, rewritten HTML', () => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testJsonFileToBe(prefixesMap);
});
