import TestUtils from '../../../../tests/TestUtils';
import { Compiler, minifiedSelectorGenerator } from '../../src';

const testName = 'selectors-mangling';
const testUtils = new TestUtils('stylify', testName);

beforeEach(() => {
	minifiedSelectorGenerator.processedSelectors = {};
});

/**
 * This test is here, because dollars were removed when content was mangled. It is becuase $$ is replaced by $
 * and it broke some of the functionality in some codes when mangled.
 */
test('Mangle with special characters - dollars should stay as they are and non should removed.', (): void => {
	const fileName = 'mangle-with-special-characters';
 	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		dev: true,
		mangleSelectors: true
	});

	let compilationResult = compiler.compile(inputContent);
	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Mangle single letter macros', (): void => {
	const fileName = 'mangle-single-letter-macros';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		dev: true,
		mangleSelectors: true,
		macros: {
			'm:(\\S+?)': ({match, selectorProperties}) => {
				selectorProperties.add('margin', match.getCapture(0));
			}
		}
	});
	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Duplicate selectors', (): void => {
	const fileName = 'mangle-duplicate-selectors';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({ mangleSelectors: true });
	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Component selector similar to custom selector', (): void => {
	const fileName = 'components-and-custom-selectors-collision';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		dev: true,
		mangleSelectors: true,
		ignoredAreas: [
			/(-link)/
		],
		customSelectors: {
			'.docs__section-link': 'font-weight:bold'
		},
		components: {
			link: 'color:blue'
		}
	});
	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});


test('Chained classes from custom selector', (): void => {
	const fileName = 'chained-classes-from-custom-selector';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({ dev: true, mangleSelectors: true });
	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});


test('Mangled selector with prefix', (): void => {
	const fileName = 'mangled-selectors-prefix';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		mangleSelectors: true,
		dev: true,
		mangledSelectorsPrefix: 's'
	});

	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Mangled selectors with selector prefix', (): void => {
	const fileName = 'selectors-prefix';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		mangleSelectors: true,
		dev: true,
		selectorsPrefix: 'u-'
	});

	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Mangling similar areas right behind each other', (): void => {
	const fileName = 'similar-areas-behind-each-other';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		mangleSelectors: true,
		dev: true,
		selectorsAreas: [
			/addAttribute\(([\s\S]+), (?:"|\\')class:list(?:"|')\)/,
			/addAttribute\(([\s\S]+), (?:"|')class(?:"|')\)/
		]
	});

	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Escaped match area', (): void => {
	const fileName = 'escaped-match-area';
	const inputContent = testUtils.getInputFile(`${fileName}.yaml`);

	const compiler = new Compiler({
		mangleSelectors: true,
		dev: true,
		selectorsAreas: [
			/class=\\"([^"]+)\\"/
		]
	});

	let compilationResult = compiler.compile(inputContent);

	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
	testUtils.testFileToBe(compiler.rewriteSelectors(inputContent), 'yaml', fileName);
});

test('Remove whitespaces from mangled attribute', (): void => {
	const fileName = 'whitespace-removal';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		mangleSelectors: true
	});

	compiler.compile(inputContent);

	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Identical ignored areas', (): void => {
	const fileName = 'identical-ignored-areas';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		mangleSelectors: true,
		ignoredAreas: [
			/(menu-link)/
		]
	});

	compiler.compile(inputContent);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});

test('Selectors areas', (): void => {
	const fileName = 'selectors-areas';
	const inputContent = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		mangleSelectors: true,
	});

	compiler.compile(inputContent);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(inputContent), fileName);
});
