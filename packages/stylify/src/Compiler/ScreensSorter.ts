export type ScreensToSortMapType = Map<string, any>;

class ScreensSorter {

	public sortCssTreeMediaQueries = (screensList: ScreensToSortMapType): ScreensToSortMapType => {
		const sortedScreens: ScreensToSortMapType = new Map();
		sortedScreens.set('_', screensList.get('_'));
		screensList.delete('_');

		const lightModeScreensListKeys: string[] = [];
		const darkModeScreensListKeys: string[] = [];
		const printScreensListKeys: string[] = [];

		const screensListKeysArray = [...screensList.keys()].filter((screen) => {
			if (screen.includes('(prefers-color-scheme: dark)')) {
				darkModeScreensListKeys.push(screen);
				return false;
			} else if (screen.includes('(prefers-color-scheme: light)')) {
				lightModeScreensListKeys.push(screen);
				return false;
			} else if (screen.includes('print')) {
				printScreensListKeys.push(screen);
				return false;
			}
			return true;
		});

		const convertUnitToPxSize = (unit: string): number => {
			const unitMatch = (/(\d*\.?\d+)(ch|em|ex|px|rem)/).exec(unit);

			if (!unitMatch) {
				return null;
			}

			const unitSize = unitMatch[1];
			const unitType = unitMatch[2];
			let newUnitSize = parseFloat(unitSize);

			if (unitType === 'ch') {
				newUnitSize = parseFloat(unitSize) * 8.8984375;
			} else if (['em', 'rem'].includes(unitType)) {
				newUnitSize = parseFloat(unitSize) * 16;
			} else if (unitType === 'ex') {
				newUnitSize = parseFloat(unitSize) * 8.296875;
			}

			return newUnitSize;
		};

		const getMediaQueryValue = (mediaQuery: string): number => {
			// eslint-disable-next-line no-useless-escape
			const regExp = new RegExp('[\\w-]+: ?\\d*\.?\\d+(?:ch|em|ex|px|rem)');
			const match = regExp.exec(mediaQuery);
			return match ? convertUnitToPxSize(match[0]) : Number.MAX_VALUE;
		};

		const separateAndSort = (cssTreeKeys: string[], mediaQueryType: string, desc = false): string[] => {
			const cssTreeKeysToReturn: string[] = [];
			const sortedKeys = cssTreeKeys
				.filter((mediaQuery): boolean => {
					// eslint-disable-next-line no-useless-escape
					const regExp = new RegExp(`${mediaQueryType}: ?\\d*\.?\\d+(?:ch|em|ex|px|rem)`);

					if (!regExp.exec(mediaQuery)) {
						cssTreeKeysToReturn.push(mediaQuery);
						return false;
					}

					return true;
				})
				.sort((next: string, previous: string): number => {
					const result = getMediaQueryValue(next) > getMediaQueryValue(previous);

					if (desc) {
						return result ? -1 : 0;
					}

					return result ? 0 : -1;
				});

			mapSortedKeys(sortedKeys);

			return cssTreeKeysToReturn;
		};

		const mapSortedKeys = (sortedKeys: string[]): void => {
			for (const sortedKey of sortedKeys) {
				sortedScreens.set(sortedKey, screensList.get(sortedKey));
				screensList.delete(sortedKey);
			}
		};

		const sortScreensListKeys = (screensListKeys: string[]): string[] => {
			screensListKeys = separateAndSort(screensListKeys, 'min-width');
			screensListKeys = separateAndSort(screensListKeys, 'min-height');
			screensListKeys = separateAndSort(screensListKeys, 'max-width', true);
			screensListKeys = separateAndSort(screensListKeys, 'max-height', true);
			screensListKeys = separateAndSort(screensListKeys, 'min-device-width');
			screensListKeys = separateAndSort(screensListKeys, 'min-device-height');
			screensListKeys = separateAndSort(screensListKeys, 'max-device-width', true);
			screensListKeys = separateAndSort(screensListKeys, 'max-device-height', true);
			return screensListKeys;
		};

		mapSortedKeys([
			...sortScreensListKeys(screensListKeysArray),
			...sortScreensListKeys(lightModeScreensListKeys),
			...sortScreensListKeys(darkModeScreensListKeys),
			...sortScreensListKeys(printScreensListKeys)
		]);

		return sortedScreens;
	};

}

export const screensSorter = new ScreensSorter();
