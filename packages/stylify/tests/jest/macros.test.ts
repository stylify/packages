import TestUtils from '../../../../tests/TestUtils';
import { Compiler, minifiedSelectorGenerator } from '../../src';

const testName = 'macros';
const testUtils = new TestUtils('stylify', testName);

beforeEach(() => minifiedSelectorGenerator.processedSelectors = {});

test('Single letter macros', (): void => {
	const inputIndex = testUtils.getHtmlInputFile('single-letter-macros');

	const compiler = new Compiler({
		dev: true,
		macros: {
			'm:(\\S+?)': ({match, selectorProperties}) => {
				selectorProperties.add('margin', match.getCapture(0));
			}
		}
	});

	let compilationResult = compiler.compile(inputIndex);

	testUtils.testCssFileToBe(compilationResult.generateCss(), 'single-letter-macros');
});

test('Custom macros', (): void => {
	const inputIndex = testUtils.getHtmlInputFile('custom-macros');

	const compiler = new Compiler({
		dev: true,
		macros: {
			'zi:(\\S+?)': ({match, selectorProperties}) => {
				selectorProperties.addMultiple({
					'position': 'relative',
					'z-index': Number(match.getCapture(0))
				});
			},
			'padding-y:(\\S+?)': ({ match, selectorProperties }) => {
				selectorProperties.add('padding-top', match.getCapture(0));
				selectorProperties.add('padding-bottom', match.getCapture(0));
			},
		}
	});

	let compilationResult = compiler.compile(inputIndex);

	testUtils.testCssFileToBe(compilationResult.generateCss(), 'custom-macros');
});

test('Selectors areas', (): void => {
	const inputIndex = testUtils.getHtmlInputFile('selectors-areas');

	const compiler = new Compiler({ dev: true });

	let compilationResult = compiler.compile(inputIndex);

	testUtils.testCssFileToBe(compilationResult.generateCss(), 'selectors-areas');
});

test('Selectors prefix', (): void => {
	const fileName = 'selectors-prefix';
	const inputIndex = testUtils.getHtmlInputFile(fileName);

	const compiler = new Compiler({
		dev: true,
		selectorsPrefix: 'u-'
	});

	let compilationResult = compiler.compile(inputIndex);
	testUtils.testCssFileToBe(compilationResult.generateCss(), fileName);
});
