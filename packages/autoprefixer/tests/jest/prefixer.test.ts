import TestUtils from './TestUtils';
import { Compiler } from '@stylify/stylify';
import { nativePreset, hooksManager } from '@stylify/stylify';
import { Prefixer, PrefixesGenerator } from '../../src';

const prefixesGenerator = new PrefixesGenerator();
const testName = 'prefixer';
const testUtils = new TestUtils(testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;

// Prefixes server side pregeneration simulation
const serverCompiler = new Compiler(nativePreset.compiler);
let serverCompilationResult = serverCompiler.compile(inputIndex);
const prefixesMap = prefixesGenerator.createPrefixesMap(serverCompilationResult);

// In browser or SSR prefixing simulation
const compiler = new Compiler(nativePreset.compiler);
new Prefixer(hooksManager, prefixesMap);
let compilationResult = compiler.compile(inputIndex);

test('Generated css, rewritten HTML', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testJsonFileToBe(prefixesMap);
});
