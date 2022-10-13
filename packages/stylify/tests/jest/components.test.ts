import TestUtils from '../../../../tests/TestUtils';
import { Compiler, minifiedSelectorGenerator } from '../../src';

const testName = 'components';
const testUtils = new TestUtils('stylify', testName);

beforeEach(() => {
	minifiedSelectorGenerator.reset()
});

test('Components', (): void => {
	const compiler = new Compiler({
		dev: true,
		components: {
			'button': 'padding:8px background-color:#000 display:inline-block font-size:24px hover:color:blue',
			'button--big': `
				.button& {
					padding:12px font-size:24px
				}
			`,
			'container_wrapper': 'padding:4px',
			'container': 'max-width:800px margin:0_auto',
			'title': `font-size:24px color:green font-size:24px md:font-size:32px`,
			'not-used': 'color:steelblue',
		}
	});

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile());
	testUtils.testCssFileToBe(compilationResult.generateCss());
});


test('Components - mangle selectors', (): void => {
	const testFileName = 'mangle-selectors'
	const compiler = new Compiler({
		dev: true,
		mangleSelectors: true,
		components: {
			'button': 'padding:8px background-color:#000 display:inline-block font-size:24px',
			'container': `max-width:800px margin:0_auto`,
			'title': 'font-size:24px color:green font-size:24px md:font-size:32px',
			'not-used': `'color:steelblue'`
		}
	});

	const input = testUtils.getHtmlInputFile(testFileName);
	let compilationResult = compiler.compile(input);
	testUtils.testCssFileToBe(compilationResult.generateCss(), testFileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(input), testFileName);
});

const nestedSyntaxCompilerConfig = {
	dev: true,
	components: {
		'button--big': `
			font-size:24px

			span {
				border-left:4px_solid_red
			}
		`,
		'button': `
			background:#000
			color:#fff
			border:none
			transition:background_0.3s

			&:hover {
				background:#888
			}

			> {
				span, i {
					vertical-align:middle
				}
			}

			span {
				font-weight:bold
			}

			.not-minified { color:darkred }

			header & {
				color:orange
				padding:12px
				md:margin:12px
			}

			&.button--big {
				padding:24px

				span {
					border-left:8px_solid_red
				}
			}
		`
	}
};

test('Components - nested syntax', (): void => {
	const testFileName = 'nested-syntax';
	const compiler = new Compiler(nestedSyntaxCompilerConfig);

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile(testFileName));
	testUtils.testCssFileToBe(compilationResult.generateCss(), testFileName);
});

test('Components - nested syntax - mangled', (): void => {
	const testFileName = 'nested-syntax-mangled';
	const compiler = new Compiler({
		mangleSelectors: true,
		...nestedSyntaxCompilerConfig
	});

	compiler.addCustomSelector('#wrapper', `
		.not-minified-2 { color:darkred }
		.header { color:green }
		header { color:orange }
	`)

	compiler.addComponent('header', `
		font-style:italic

		+ #header { color:purple }
	`)

	const input = testUtils.getHtmlInputFile(testFileName);
	let compilationResult = compiler.compile(input);
	testUtils.testCssFileToBe(compilationResult.generateCss(), testFileName);
	testUtils.testHtmlFileToBe(compiler.rewriteSelectors(input), testFileName);
});
