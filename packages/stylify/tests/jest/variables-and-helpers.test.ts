import TestUtils from '../../../../tests/TestUtils';
import { Compiler, CompilerConfigInterface } from '../../src';

const testName = 'variables-and-helpers';
const testUtils = new TestUtils('stylify', testName);

const darkThemeVariables = {
	bg: 'black',
	color: 'white'
};

const getCompilerConfig = (): CompilerConfigInterface => ({
	dev: true,
	screens: {
		md: '(min-width: 640px)',
		lg: () => '(min-width: 1024px)',
		dark: '(prefers-color-scheme: dark)',
		'minw\\w+': (match): string => `(min-width: ${match.fullMatch.replace('minw', '')})`,
	},
	helpers: {
		textPropertyType(value: string): string {
			if (value === 'bold') {
				return 'font-weight';
			} else if (value === 'italic') {
				return 'font-style'
			}
			return value;
		},
		myContent(...strings: string[]): string {
			return `"${strings.join(' ')}"`;
		},
		shortcut(value: string): string {
			const shortcuts = {
				'bgc': 'background-color',
				'fs': 'font-size',
				'clr': 'color',
				'zi': 'z-index'
			};

			return value in shortcuts ? shortcuts[value] : value;
		}
	},
	macros: {
		'text:(\\S+)'({ match, selectorProperties }): void {
			const property = this.helpers.textPropertyType.call(this, match.getCapture(0));
			selectorProperties.add(property, match.getCapture(0));
		},
		'(fs|bgc|zi|clr):(\\S+)'({match, selectorProperties }): void {
			const property = this.helpers.shortcut.call(this, match.getCapture(0));
			selectorProperties.add(property, match.getCapture(1));
		},
		'fix:(\\S+)'({match, selectorProperties}): void {
			selectorProperties.addMultiple({
				position: 'fixed',
				top: match.getCapture(0),
				left: match.getCapture(0)
			});
		}
	}
});

test('Variables and helpers', (): void => {
	const compilerConfig = getCompilerConfig();
	compilerConfig.variables = {
		blue: '#0000FF',
		border: 'border 1px solid lighten($blue,10)',
		bg: 'white',
		color: 'black',
		fontSize: '12px',
		dark: darkThemeVariables,
		'html[theme="dark"]': darkThemeVariables,
		'.dark-theme': darkThemeVariables,
		':root.dark': darkThemeVariables,
		minw450px: {
			fontSize: '18px'
		},
		lg: {
			fontSize: '24px'
		}
	}
	const compiler = new Compiler(compilerConfig);

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile());
	testUtils.testCssFileToBe(compilationResult.generateCss());
});

test('Variables and helpers - cssVariablesEnabled', (): void => {
	const compilerConfig = getCompilerConfig();
	compilerConfig.variables = {
		lightblack: 'lighten(#000,5)',
		black: 'lighten($lightblack,5)',
		border2: 'border 1px solid $black',
	};
	const compiler = new Compiler(compilerConfig);

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile('second'));
	testUtils.testCssFileToBe(compilationResult.generateCss(), 'second');
});

test('External Variables', (): void => {
	const compiler = new Compiler({
		dev: true,
		externalVariables: [
			'test',
			/^ext-/,
			(variable) => variable.startsWith('md-') ? true : undefined
		],
	});

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile('third'));
	testUtils.testCssFileToBe(compilationResult.generateCss(), 'third');
});

test('External Variables - helpers exception', (): void => {
	const compiler = new Compiler({
		dev: true,
		cssVariablesEnabled: true,
		externalVariables: ['test'],
	});

	expect(() => compiler.compile('<div class="color:lighten($test)"></div>'))
		.toThrow('Helpers cannot use external variables. Processing helper "lighten" and variable "$test"');
});

test('Undefined variable', (): void => {
	const compiler = new Compiler();
	expect(() => compiler.compile('<div class="color:lighten($test)"></div>'))
		.toThrow('Stylify: Variable \"test\" not found while processing \"lighten($test)\".');
});

test('Undefined variable - warning only', (): void => {
	const compiler = new Compiler({
		dev: true,
		undefinedVariableWarningLevel: 'warning',
	});

	console.warn = jest.fn();
	compiler.compile('<div class="color:$test"></div>');

	expect(console.warn).toHaveBeenCalledWith('Stylify: Variable "test" not found while processing "color:$test".');
});

test('Scoped variables', (): void => {
	const compiler = new Compiler({
		dev: true,
		cssVariablesEnabled: true,
		variables: {
			background: '#000',
			dark: {
				background: '#444',
				backgroundHover: 'lighten($background,20)'
			}
		}
	});

	testUtils.testCssFileToBe(
		compiler.compile('<input>').generateCss(), 'scoped-variables'
	);
});
