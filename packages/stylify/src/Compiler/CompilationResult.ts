import { CssRecord, MacroMatch, SelectorProperties, SerializedCssRecordInterface } from '.';
import { stringHashCode } from './stringHashCode';

type ScreensListMapType = Map<string, number|null>;

type OnPrepareCssRecordCallbackType = (cssRecord: CssRecord) => void;

type ScreenSortingFunctionType = (screensList: ScreensListMapType) => ScreensListMapType;

export type ScreensListRecordType = Record<string, number>;

export type SelectorsListType = Record<string, SerializedCssRecordInterface>;

export interface CompilationResultConfigInterface {
	dev?: boolean,
	reconfigurable?: boolean,
	screensSortingFunction?: ScreenSortingFunctionType,
	screensList?: ScreensListRecordType,
	selectorsList?: SelectorsListType,
	componentsList?: string[],
	mangleSelectors?: boolean,
	onPrepareCssRecord?: OnPrepareCssRecordCallbackType | string,
	defaultCss?: string
}

export interface SerializedCompilationResultInterface {
	dev?: boolean,
	reconfigurable?: boolean,
	screensSortingFunction?: string,
	screensList?: ScreensListRecordType,
	selectorsList?: SelectorsListType,
	componentsList?: string[],
	mangleSelectors?: boolean,
	onPrepareCssRecord?: string,
	defaultCss?: string
}

export interface SelectorsListInterface {
	processed: boolean
}

export type SelectorsComponentsMapType = Record<string, SelectorsComponentsMapInterface[]>;

export interface SelectorsComponentsMapInterface {
	component: string,
	selectorsChain: string[]
}

export class CompilationResult {

	private screensList: ScreensListMapType = new Map();

	private screensListSorted = false;

	public reconfigurable = true;

	public changed = false;

	public mangleSelectors = false;

	public dev = false;

	public selectorsList: Record<string, CssRecord> = {};

	public componentsList: string[] = [];

	public screensSortingFunction: ScreenSortingFunctionType = null;

	public onPrepareCssRecord: OnPrepareCssRecordCallbackType = null;

	public defaultCss = '';

	public constructor(config: CompilationResultConfigInterface | SerializedCompilationResultInterface = {}) {
		this.addScreen('_');
		this.configure(config);
	}

	public configure(config: CompilationResultConfigInterface | SerializedCompilationResultInterface = {}): void {
		if (!Object.keys(config).length) {
			return;
		}
		this.dev = typeof config.dev === 'boolean' ? config.dev : this.dev;
		this.reconfigurable = typeof config.reconfigurable === 'boolean' ? config.reconfigurable : this.reconfigurable;
		this.mangleSelectors = typeof config.mangleSelectors === 'boolean'
			? config.mangleSelectors
			: this.mangleSelectors;

		this.defaultCss = config.defaultCss || this.defaultCss;
		this.componentsList = [...this.componentsList, ...config.componentsList || []];

		if ('selectorsList' in config) {
			for (const selector in config.selectorsList) {
				const selectorData = config.selectorsList[selector];
				if (selector in this.selectorsList) {
					this.selectorsList[selector].configure(selectorData);
				} else {
					this.selectorsList[selector] = new CssRecord(selectorData);
				}
			}
		}

		if ('screensSortingFunction' in config) {
			this.screensSortingFunction = typeof config.screensSortingFunction === 'string'
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				? new Function(config.screensSortingFunction) as ScreenSortingFunctionType
				: config.screensSortingFunction;
		}

		if ('onPrepareCssRecord' in config) {
			this.onPrepareCssRecord = typeof config.onPrepareCssRecord === 'string'
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				? new Function(config.onPrepareCssRecord) as OnPrepareCssRecordCallbackType
				: config.onPrepareCssRecord;
		}

		this.addScreens(config.screensList || {});
	}

	private getScreenById(searchId): string {
		let searchedScreen: string = null;
		[...this.screensList].find(([screen, screenId]) => {
			const found = screenId === searchId;
			if (found) {
				searchedScreen = screen;
			}
			return found;
		});

		return searchedScreen;
	}

	private addScreens(screens: Record<string, number>): void {
		for (const screen in screens) {
			this.addScreen(screen, screens[screen]);
		}
	}

	private addScreen(screen: string, screenId: number = this.screensList.size) {
		if (this.screensList.has(screen)) {
			return;
		}

		this.screensList.set(screen, screenId);
		this.screensListSorted = false;
	}

	public generateCss(all = false): string {
		let css = this.defaultCss;

		const newLine = this.dev ? '\n' : '';
		const cssTree: Record<string, string> = {};

		for (const selector in this.selectorsList) {
			const cssRecord = this.selectorsList[selector];

			if (!all && !cssRecord.shouldBeGenerated) {
				continue;
			}

			const screen = this.getScreenById(cssRecord.screenId);

			if (!(screen in cssTree)) {
				cssTree[screen] = '';
			}

			cssTree[screen] += this.selectorsList[selector].generateCss({
				minimize: !this.dev,
				mangleSelectors: this.mangleSelectors
			});
		}

		if (!this.screensListSorted) {
			this.screensList = this.sortCssTreeMediaQueries(this.screensList);
		}

		for (const [screen] of this.screensList) {
			const screenCss = cssTree[screen] || null;
			if (!screenCss) {
				continue;
			}
			css += screen === '_' ? screenCss : `${newLine}@media ${screen} {${newLine}${screenCss}}${newLine}`;
		}

		this.changed = false;

		return css.trim();
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties: SelectorProperties): void {
		if (macroMatch.fullMatch in this.selectorsList) {
			this.selectorsList[macroMatch.fullMatch].shouldBeGenerated = true;
			return;
		}

		const selector = macroMatch.selector;
		const screen = macroMatch.screen;

		if (!this.screensList.has(screen)) {
			this.addScreen(screen);
		}

		const newCssRecord = new CssRecord({
			screenId: this.screensList.get(screen),
			selector: selector,
			pseudoClasses: macroMatch.pseudoClasses,
			shouldBeGenerated: true
		});

		if (this.onPrepareCssRecord) {
			this.onPrepareCssRecord(newCssRecord);
		}

		newCssRecord.addProperties(selectorProperties.properties);

		this.selectorsList[selector] = newCssRecord;
		this.changed = true;
	}

	public bindPlainSelectorsToSelectors(plainSelectorsSelectorsMap: Record<string, string[]>): void {
		for (const plainSelector in plainSelectorsSelectorsMap) {
			for (const dependencySelector of plainSelectorsSelectorsMap[plainSelector]) {
				if (!(dependencySelector in this.selectorsList)) {
					const info = `Selector "${dependencySelector}" for plainSelector "${plainSelector}" was not matched and therefore not added.`;

					if (this.dev) {
						console.warn(info);
					} else {
						throw new Error(info);
					}
					continue;
				}

				this.selectorsList[dependencySelector].addPlainSelector(plainSelector);
			}
		}
	}

	public bindComponentsToSelectors(selectorsComponentsMap: SelectorsComponentsMapType): void {
		for (const componentDependencySelector in selectorsComponentsMap) {
			for (const componentToBind of selectorsComponentsMap[componentDependencySelector]) {
				if (!(componentDependencySelector in this.selectorsList)) {
					const info = `Selector "${componentDependencySelector}" for component "${componentToBind.component}" was not matched and therefore not added.`;

					if (this.dev) {
						console.warn(info);
					} else {
						throw new Error(info);
					}

					continue;
				}

				if (!this.componentsList.includes(componentToBind.component)) {
					this.componentsList.push(componentToBind.component);
				}

				componentToBind.selectorsChain = componentToBind.selectorsChain
					.map((selectorsChain: string): string => {
						return selectorsChain
							.split(' ')
							.map((selectorFromChain: string) => {
								if (this.mangleSelectors) {
									if (!(selectorFromChain in this.selectorsList)
										&& !this.componentsList.includes(selectorFromChain)
									) {
										const info = `Stylify: selector "${selectorFromChain}" from component "${componentToBind.component}" selectorsChain list not found.`;
										if (this.dev) {
											console.warn(info);
										} else {
											throw new Error(info);
										}
									}

									selectorFromChain = stringHashCode(selectorFromChain);
								}

								return selectorFromChain;
							})
							.join(' ');
					});

				this.selectorsList[componentDependencySelector].addComponent(
					this.mangleSelectors ? stringHashCode(componentToBind.component) : componentToBind.component,
					componentToBind.selectorsChain
				);
			}
		}
	}

	private sortCssTreeMediaQueries(screensList: ScreensListMapType): ScreensListMapType {
		this.screensListSorted = true;
		if (this.screensSortingFunction) {
			return this.screensSortingFunction(screensList);
		}

		const sortedScreens: ScreensListMapType = new Map();
		sortedScreens.set('_', screensList.get('_'));
		screensList.delete('_');

		const lightModeScreensListKeys = [];
		const darkModeScreensListKeys = [];
		const printScreensListKeys = [];
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
	}

	public serialize(): SerializedCompilationResultInterface {
		const serializedCompilationResult: SerializedCompilationResultInterface = {};

		if (this.mangleSelectors) {
			serializedCompilationResult.mangleSelectors = this.mangleSelectors;
		}

		if (this.dev) {
			serializedCompilationResult.dev = this.dev;
		}

		if (!this.reconfigurable) {
			serializedCompilationResult.reconfigurable = false;
		}

		if (this.screensList.size > 1) {
			serializedCompilationResult.screensList = {};
			for (const [screen, screenId] of this.screensList) {
				serializedCompilationResult.screensList[screen] = screenId;
			}
		}

		if (this.screensSortingFunction) {
			serializedCompilationResult.screensSortingFunction = this.screensSortingFunction.toString();
		}

		if (Object.keys(this.componentsList).length) {
			serializedCompilationResult.componentsList = this.componentsList;
		}

		if (Object.keys(this.selectorsList).length) {
			serializedCompilationResult.selectorsList = {};
			for (const selector in this.selectorsList) {
				serializedCompilationResult.selectorsList[selector] = this.selectorsList[selector].serialize();
			}
		}

		if (this.onPrepareCssRecord) {
			serializedCompilationResult.onPrepareCssRecord = this.onPrepareCssRecord.toString();
		}

		return serializedCompilationResult;
	}

}
