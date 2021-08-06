const minWidthScreen = (screen) => `(min-width: ${screen.replace('minw', '')})`;
const maxWidthScreen = (screen) => `(max-width: ${screen.replace('maxw', '')})`;
const minHeightScreen = (screen) => `(min-height: ${screen.replace('minh', '')})`;
const maxHeightScreen = (screen) => `(max-height: ${screen.replace('maxh', '')})`;
const orientationScreen = (screen) => `(orientation: ${screen})`;

const nativePreset = {
	compiler: {
		screens: {
			toxs: maxWidthScreen('319px'),
			xs: minWidthScreen('320px'),
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
			screen: 'screen',
			portrait: orientationScreen('portrait'),
			landscape: orientationScreen('landscape'),
			dark: '(prefers-color-scheme: dark)'
		},
		macros: {
			__MACROS__
		}
	}
};

export {
	nativePreset
};
