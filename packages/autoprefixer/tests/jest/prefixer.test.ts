import TestUtils from '../../../../tests/TestUtils';
import { Compiler, CssRecord } from '@stylify/stylify';
import { nativePreset, CompilationResult } from '@stylify/stylify';
import { Prefixer, PrefixesGenerator } from '../../src';

const prefixesGenerator = new PrefixesGenerator();
const testName = 'prefixer';
const testUtils = new TestUtils('autoprefixer', testName);
const inputIndex = testUtils.getHtmlInputFile();

nativePreset.compiler.dev = true;

// Prefixes server side pregeneration simulation
let serverCompilationResult = new Compiler(nativePreset.compiler).compile(inputIndex);
const prefixesMap = prefixesGenerator.createPrefixesMap(serverCompilationResult);

// In browser or SSR prefixing simulation
const prefixer = new Prefixer(prefixesMap);
let compilationResult = new Compiler(nativePreset.compiler).compile(
	inputIndex,
	new CompilationResult({
		onPrepareCssRecord: (cssRecord: CssRecord): void => {
			cssRecord.onAddProperty = (propertyName: string, propertyValue: string): Record<string, any> => {
				return prefixer.prefix(propertyName, propertyValue);
			}
		}
	})
);

test('Generate prefixes, prefix css', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
	testUtils.testJsonFileToBe(prefixesMap);
});
