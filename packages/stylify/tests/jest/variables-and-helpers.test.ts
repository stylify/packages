import TestUtils from '../../../../tests/TestUtils';
import { Compiler, CompilerConfigInterface, MacroMatch, SelectorProperties } from '../../src';

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
		'minw\\w+': (screen: string): string => `(min-width: ${screen.replace('minw', '')})`,
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
		'text:(\\S+)': function (m: MacroMatch, p: SelectorProperties): void {
			const property = this.helpers.textPropertyType(m.getCapture(0));
			p.add(property, m.getCapture(0));
		},
		'(fs|bgc|zi|clr):(\\S+)': function (m: MacroMatch, p: SelectorProperties): void {
			const property = this.helpers.shortcut(m.getCapture(0));
			p.add(property, m.getCapture(1));
		},
		'fix:(\\S+)': function (m: MacroMatch, p: SelectorProperties): void {
			p.addMultiple({
				position: 'fixed',
				top: m.getCapture(0),
				left: m.getCapture(0)
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

test('Variables and helpers - replaceVariablesByCssVariables', (): void => {
	const compilerConfig = getCompilerConfig();
	compilerConfig.replaceVariablesByCssVariables = true;
	compilerConfig.variables = {
		lightblack: 'lighten(#000,5)',
		black: 'lighten($lightblack,5)',
		border2: 'border 1px solid $black',
	};
	const compiler = new Compiler(compilerConfig);

	let compilationResult = compiler.compile(testUtils.getHtmlInputFile('second'));
	testUtils.testCssFileToBe(compilationResult.generateCss(), 'second');
});
