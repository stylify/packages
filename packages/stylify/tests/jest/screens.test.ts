import TestUtils from '../../../../tests/TestUtils';
import { Compiler, minifiedSelectorGenerator } from '../../src';

const testName = 'screens';
const testUtils = new TestUtils('stylify', testName);

beforeEach(() => {
	minifiedSelectorGenerator.processedSelectors = {};
});

test('Dynamic screens', (): void => {
	const inputIndex = testUtils.getHtmlInputFile();

	const compiler = new Compiler({ dev: true });
	let compilationResult = compiler.compile(inputIndex);

	testUtils.testCssFileToBe(compilationResult.generateCss());
});

test('Similar screens', (): void => {
	const compiler = new Compiler({
		dev: true,
		screens: {
			'tablet': '(min-width: 123px)',
			'tablet-deprecated': '(min-width: 345px)'
		}
	});

	testUtils.testCssFileToBe(
		compiler.compile('tablet:color:blue tablet-deprecated:color:red', undefined, false).generateCss(),
		'similar-screens'
	);
});
