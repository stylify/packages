import TestUtils from '../../../../tests/TestUtils';
import { Compiler, MacroMatch, SelectorProperties } from '../../src';

const testName = 'variables-and-helpers';
const testUtils = new TestUtils('stylify', testName);
const inputIndex = testUtils.getHtmlInputFile();

const compiler = new Compiler({
	dev: true,
	screens: {
		md: '(min-width: 640px)'
	},
	variables: {
		textColor: '#87CEEB',
		grey: '#eeeeee'
	},
	helpers: {
		textPropertyType(value: string): string {
			if (value === 'bold') {
				return 'font-weight';
			} else if (value === 'italic') {
				return 'font-style'
			} else if (value.includes('$')) {
				return 'color';
			}
		},
		shortcut(value: string): string {
			const shortcuts = {
				'bgc': 'background-color',
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
		'(bgc|zi):(\\S+)': function (m: MacroMatch, p: SelectorProperties): void {
			const property = this.helpers.shortcut(m.getCapture(0));
			p.add(property, m.getCapture(1));
		}
	}
});

let compilationResult = compiler.compile(inputIndex);

test('Variables and helpers', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
