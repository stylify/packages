import type { CompilerConfigInterface, MacroMatch, SelectorProperties } from '..';

const rangeScreen = (screen: string): string => {
	const ranges = screen.replace('rng', '').split('-');
	return `${minWidthScreen(ranges[0])} and ${maxWidthScreen(ranges[1])}`;
};
const minWidthScreen = (screen: string): string => `(min-width: ${screen.replace('minw', '')})`;
const maxWidthScreen = (screen: string): string => `(max-width: ${screen.replace('maxw', '')})`;
const minHeightScreen = (screen: string): string => `(min-height: ${screen.replace('minh', '')})`;
const maxHeightScreen = (screen: string): string => `(max-height: ${screen.replace('maxh', '')})`;
const orientationScreen = (screen: string): string => `(orientation: ${screen})`;

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
			rng: rangeScreen,
			screen: 'screen',
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
		}
	} as Partial<CompilerConfigInterface>
};

export {
	nativePreset
};
