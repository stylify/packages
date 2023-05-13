import TestUtils from '../../../../tests/TestUtils';
import { Compiler, minifiedSelectorGenerator } from '../../src';

const testName = 'custom-selectors';
const testUtils = new TestUtils('stylify', testName);

beforeEach(() => {
	minifiedSelectorGenerator.processedSelectors = {};
});

test('Custom selectors - only set', (): void => {
	const customSelectors = {
		'*': 'box-sizing:border-box',
		'body': 'font-size:16px',
		'article h1': 'font-size:16px',
		'::selection': 'color:#fff',
		a: 'hover:color:red',
		'h2:hover': 'color:green'
	};

	const compiler = new Compiler({
		dev: true,
		customSelectors
	});

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile());

	testUtils.testCssFileToBe(compilationResult.generateCss());
});

test('Random order', (): void => {
	const compiler = new Compiler({
		dev: true,
		components: {
			'btn:(\\S+)': (match) => {
				const types = {
					'orange': `
						color:#fff
						&:focus { background:darkorange }
						font-size:16px
					`
				};

				let typeUtilities = undefined;
				const capture = match.getCapture(0);

				if (capture !== undefined) {
					typeUtilities = types[capture];
				}

				if (typeof typeUtilities === 'undefined') {
					throw new Error(`Button type "${match.getCapture(0)}" not found.`);
				}

				return typeUtilities;
			}
		}
	});

	let compilationResult = compiler.compile('btn:orange', undefined, false);

	testUtils.testCssFileToBe(compilationResult.generateCss(), 'random-order');
});

test('Duplicate definition', (): void => {
	const customSelectors = {
		'article': `
			h1, h2 {
				color:blue
				span { margin:24px }
			}
			h2 {
				font-size:24px
				span { font-weight:bold }
			}
		`
	};

	const compiler = new Compiler({
		dev: true,
		customSelectors
	});

	let compilationResult = compiler.compile('<article></article>');

	testUtils.testCssFileToBe(compilationResult.generateCss(), 'duplicate-definition');
});
