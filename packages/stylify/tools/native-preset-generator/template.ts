import type { CompilerConfigInterface, MacroMatch, SelectorProperties } from '..';

export interface RgbDataInterface {
	r: number | null
	g: number | null
	b: number | null
}

const rangeScreen = (screen: string): string => {
	const ranges = screen.replace('rng', '').split('-');
	return `${minWidthScreen(ranges[0])} and ${maxWidthScreen(ranges[1])}`;
};
const minWidthScreen = (screen: string): string => `(min-width: ${screen.replace('minw', '')})`;
const maxWidthScreen = (screen: string): string => `(max-width: ${screen.replace('maxw', '')})`;
const minHeightScreen = (screen: string): string => `(min-height: ${screen.replace('minh', '')})`;
const maxHeightScreen = (screen: string): string => `(max-height: ${screen.replace('maxh', '')})`;
const orientationScreen = (screen: string): string => `(orientation: ${screen})`;

const parseHex = (color: string): RgbDataInterface => {
	const hex   = color.replace('#', '');
	const isHexThreeCharsLong = hex.length === 3;

	return {
		r: parseInt(isHexThreeCharsLong ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16),
		g: parseInt(isHexThreeCharsLong ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16),
		b: parseInt(isHexThreeCharsLong ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16)
	}
};

const parseRgb = (color: string): RgbDataInterface => {
	color = color.replace('rgb(', '').replace(/\)/, '');
	const colorToArray = color.split(color.includes(',') ? ',' : ' ');

	return {
		r: parseInt(colorToArray[0]),
		g: parseInt(colorToArray[1]),
		b: parseInt(colorToArray[2])
	}
};

const parseColor = (color: string): RgbDataInterface => {
	let rgbData: RgbDataInterface = {
		r: null,
		g: null,
		b: null
	};

	if (color.match(/^#/)) {
		rgbData = parseHex(color);

	} else if (color.match(/^rgb\(/)) {
		rgbData = parseRgb(color);
	}

	return rgbData;
};

const rgbToHex = (color: string|Record<string, any>) => {
	if (typeof color === 'string') {
		color = parseRgb(color);
	}

	const { r, g, b} = color;
	return '#' + [r, g, b].map((colorPart) => {
		const hex = colorPart.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}).join('');
};

const lightenDarkenColor = (color: string, amount: number): string => {
	const { r, g, b} = parseColor(color);
	const colors = [r, g, b].map((colorPart: number): number => {
		colorPart += amount;

		if (colorPart > 255) {
			colorPart = 255;
		} else if (colorPart < 0) {
			colorPart = 0;
		}

		return colorPart
	});

	return rgbToHex({
		r: colors[0],
		g: colors[1],
		b: colors[2]
	});
};

const nativePreset = {
	compiler: {
		screens: {
			tosm: maxWidthScreen('639px'),
			sm: minWidthScreen('640px'),
			tomd: maxWidthScreen('767px'),
			md: minWidthScreen('768px'),
			tolg: maxWidthScreen('1023px'),
			lg: minWidthScreen('1024px'),
			toxl: maxWidthScreen('1279px'),
			xl: minWidthScreen('1280px'),
			to2xl: maxWidthScreen('1535px'),
			'2xl': minWidthScreen('1536px'),
			to3xl: maxWidthScreen('1919px'),
			'3xl': minWidthScreen('1920px'),
			'minw\\w+': minWidthScreen,
			'maxw\\w+': maxWidthScreen,
			'minh\\w+': minHeightScreen,
			'maxh\\w+': maxHeightScreen,
			'rng[\\d\\w]+-[\\d\\w]+': rangeScreen,
			screen: 'screen',
			print: 'print',
			onlyScreen: 'only screen',
			portrait: orientationScreen('portrait'),
			landscape: orientationScreen('landscape'),
			dark: '(prefers-color-scheme: dark)',
			light: '(prefers-color-scheme: light)'
		},
		macros: {
			// eslint-disable-next-line quote-props
			'__REG_EXP__': (m: MacroMatch, p: SelectorProperties): void => {
				p.add(m.getCapture(0), m.getCapture(1));
			}
		},
		helpers: {
			darken: (color: string, amount: number) => {
				return lightenDarkenColor(color, -amount);
			},
			lighten: (color: string, amount: number) => {
				return lightenDarkenColor(color, amount);
			},
			colorToRgb: (color: string, alpha: Number = null) => {
				const { r, g, b } = parseColor(color);

				if (r === null) {
					return color;
				}

				const rgb = `${r},${g},${b}`;

				return alpha ? `rgba(${rgb},${alpha})` : `rgb(${rgb})`;
			}
		},
		onNewMacroMatch: function (macroMatch: MacroMatch, { properties }): void {
			for (const property in properties) {
				const propertyValue = properties[property];
				const matchPossibleHelper = propertyValue.match(/^(\S+)\(([^\)]+)\)/);

				if (!matchPossibleHelper) {
					continue;
				}

				const helperName = matchPossibleHelper[1] || null;
				const helperArgumentsMatch = matchPossibleHelper[2] || null;

				if (!helperName || !helperArgumentsMatch || !(helperName in this.helpers)) {
					continue;
				}

				const helperArgumentsPlaceholders =[]
				let helperArguments = helperArgumentsMatch.replace(/\'(\S+)\'/g, (fullMatch, helperArgument): string => {
					const helperPlaceholderKey = helperArgumentsPlaceholders.length;
					helperArgumentsPlaceholders.push(helperArgument);
					return `__placeholder__${helperPlaceholderKey}__`;
				});

				const helperArgumentsArray = helperArguments.split(',').map((helperArgument: any) => {
					helperArgument = helperArgument.replace(/__placeholder__(\d+)__/, (fullMatch: string, placeholderKeyMatch: string) => {
						return helperArgumentsPlaceholders[placeholderKeyMatch];
					});
					return isNaN(helperArgument) ? helperArgument : parseFloat(helperArgument);
				});

				properties[property] = this.helpers[helperName](...helperArgumentsArray);
			}
		}
	} as Partial<CompilerConfigInterface>
};

export {
	nativePreset
};
