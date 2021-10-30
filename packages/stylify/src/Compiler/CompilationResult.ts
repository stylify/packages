import { CssRecord, MacroMatch, SelectorProperties, SerializedCssRecordInterface } from '.';

export interface CompilationResultConfigInterface {
	dev?: boolean,
	reconfigurable?: boolean,
	screensSortingFunction?: CallableFunction,
	screensList?: Record<string, number>,
	selectorsList?: Record<string, CssRecord>,
	componentsList?: Record<string, string>,
	mangleSelectors?: boolean,
	variables?: Record<string, string| number>,
	onPrepareCssRecord?: CallableFunction
}

export interface SerializedCompilationResultInterface {
	dev: boolean,
	reconfigurable?: boolean,
	screensSortingFunction?: string,
	screensList?: Record<string, number>,
	selectorsList: Record<string, SerializedCssRecordInterface>,
	componentsList?: Record<string, string>
	mangleSelectors?: boolean,
	variables?: Record<string, string | number>,
	onPrepareCssRecord?: string
}

export interface SelectorsListInterface {
	mangledSelector: string,
	processed: boolean
}

type ScreensListType = Map<string, number|null>;

class CompilationResult {

	private readonly MATCH_VARIABLE_REG_EXP = /\$([\w-_]+)/g;

	private screensList: ScreensListType = new Map();

	private screensListSorted = false;

	public reconfigurable = true;

	public changed = false;

	public mangleSelectors = false;

	public dev = false;

	public selectorsList: Record<string, CssRecord> = {};

	public componentsList: Record<string, string> = {};

	public screensSortingFunction: CallableFunction = null;

	public variables: Record<string, string | number> = {};

	public lastBuildInfo: Record<string, any> = null;

	public onPrepareCssRecord: CallableFunction = null;

	public constructor(config: CompilationResultConfigInterface = {}) {
		this.setBuildInfo(null);
		this.addScreen('_');
		this.configure(config);
	}

	public configure(config: CompilationResultConfigInterface = {}): void {
		if (!Object.keys(config).length) {
			return;
		}
		this.dev = typeof config.dev === 'boolean' ? config.dev : this.dev;
		this.reconfigurable = typeof config.reconfigurable === 'boolean' ? config.reconfigurable : this.reconfigurable;
		this.selectorsList = Object.assign(this.selectorsList, 'selectorsList' in config ? config.selectorsList : {});
		this.mangleSelectors = typeof config.mangleSelectors === 'boolean'
			? config.mangleSelectors
			: this.mangleSelectors;
		this.screensSortingFunction = config.screensSortingFunction || this.screensSortingFunction;
		this.variables = {...this.variables, ...config.variables || {}};
		this.onPrepareCssRecord = config.onPrepareCssRecord || this.onPrepareCssRecord;
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

	private setBuildInfo = (data: Record<string, any> = null): void => {
		if (data === null
			|| this.lastBuildInfo === null
			|| this.changed === true && this.lastBuildInfo.completed === true
		) {
			this.lastBuildInfo = {
				processedSelectors: [],
				processedComponents: [],
				completed: false
			};
		}

		if (data === null || !this.dev) {
			return;
		}

		this.lastBuildInfo.completed = 'completed' in data ? data.completed : false;

		this.lastBuildInfo.processedComponents = [
			...this.lastBuildInfo.processedComponents, ...data.processedComponents || []
		];
		this.lastBuildInfo.processedSelectors = [
			...this.lastBuildInfo.processedSelectors, ...data.processedSelectors || []
		];
	};

	public generateCss(): string {
		let css = '';
		const newLine = this.dev ? '\n' : '';
		const cssTree: Record<string, string> = {};

		for (const selector in this.selectorsList) {
			const cssRecord = this.selectorsList[selector];
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
		this.setBuildInfo({
			completed: true
		});

		return css.trim();
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties: SelectorProperties): void {
		if (macroMatch.fullMatch in this.selectorsList) {
			this.selectorsList[macroMatch.fullMatch].shouldBeGenerated = true;
			return;
		}

		const selector = macroMatch.selector;
		const macroResult = selectorProperties.properties;
		const screen = macroMatch.screen;

		if (!this.screensList.has(screen)) {
			this.addScreen(screen);
		}

		const newCssRecord = this.createCssRecord(
			new CssRecord({
				screenId: this.screensList.get(screen),
				selector: selector,
				mangledSelector: this.getUniqueSelectorId(),
				pseudoClasses: macroMatch.pseudoClasses,
				shouldBeGenerated: true
			})
		);

		for (const property in macroResult) {
			const propertyValue = macroResult[property].replace(
				this.MATCH_VARIABLE_REG_EXP,
				(match, substring): string => {
					return String(this.variables[substring]);
				}
			);
			newCssRecord.addProperty(property, propertyValue);
		}

		this.selectorsList[selector] = newCssRecord;

		this.changed = true;

		this.setBuildInfo({
			processedSelectors: [selector]
		});
	}

	public bindComponentsSelectors(componentsSelectorsMap: Record<string, any>): void {
		const processedComponents = [];

		for (const componentDependencySelector in componentsSelectorsMap) {
			for (const component of componentsSelectorsMap[componentDependencySelector]) {
				if (!(component in this.componentsList)) {
					this.componentsList[component] = this.getUniqueSelectorId();
				}
				this.selectorsList[componentDependencySelector].addComponent(
					this.mangleSelectors ? this.componentsList[component] : component
				);
				processedComponents.push(component);
			}
		}

		this.setBuildInfo({
			processedComponents: processedComponents
		});
	}

	private sortCssTreeMediaQueries(screensList: ScreensListType): ScreensListType {
		this.screensListSorted = true;
		if (this.screensSortingFunction) {
			return this.screensSortingFunction(screensList) as ScreensListType;
		}

		const sortedScreens: ScreensListType = new Map();
		sortedScreens.set('_', screensList.get('_'));
		screensList.delete('_');

		let screensListKeysArray = [...screensList.keys()];

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

		screensListKeysArray = separateAndSort(screensListKeysArray, 'min-width');
		screensListKeysArray = separateAndSort(screensListKeysArray, 'min-height');
		screensListKeysArray = separateAndSort(screensListKeysArray, 'max-width', true);
		screensListKeysArray = separateAndSort(screensListKeysArray, 'max-height', true);
		screensListKeysArray = separateAndSort(screensListKeysArray, 'min-device-width');
		screensListKeysArray = separateAndSort(screensListKeysArray, 'min-device-height');
		screensListKeysArray = separateAndSort(screensListKeysArray, 'max-device-width', true);
		screensListKeysArray = separateAndSort(screensListKeysArray, 'max-device-height', true);
		mapSortedKeys(screensListKeysArray);

		return sortedScreens;
	}

	public serialize(): SerializedCompilationResultInterface {
		const serializedCompilationResult: SerializedCompilationResultInterface = {
			mangleSelectors: this.mangleSelectors,
			dev: this.dev,
			selectorsList: {}
		};

		if (!this.reconfigurable) {
			serializedCompilationResult.reconfigurable = false;
		}

		if (this.screensList.size) {
			serializedCompilationResult.screensList = {};
			for (const [screen, screenId] of this.screensList) {
				serializedCompilationResult.screensList[screen] = screenId;
			}
		}

		if (this.screensSortingFunction) {
			serializedCompilationResult.screensSortingFunction = this.screensSortingFunction.toString();
		}

		if (Object.keys(this.variables).length) {
			serializedCompilationResult.variables = this.variables;
		}

		if (this.componentsList.length) {
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

	public static deserialize(data: Required<SerializedCompilationResultInterface>): CompilationResult {
		const compilationResultConfig: any = {...data};

		if ('selectorsList' in compilationResultConfig) {
			for (const selector in data.selectorsList) {
				compilationResultConfig.selectorsList[selector] = CssRecord.deserialize(data.selectorsList[selector]);
			}
		}

		if ('onPrepareCssRecord' in compilationResultConfig) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			compilationResultConfig.onPrepareCssRecord = new Function(data.onPrepareCssRecord);
		}

		return new CompilationResult(compilationResultConfig);
	}

	public hydrate(data: Required<SerializedCompilationResultInterface>): void {
		this.addScreens(data.screensList || {});

		if ('selectorsList' in data) {
			for (const selector in data.selectorsList) {
				const selectorData = data.selectorsList[selector];
				if (selector in this.selectorsList) {
					this.selectorsList[selector].hydrate(selectorData);
				} else {
					this.selectorsList[selector] = CssRecord.deserialize(selectorData);
				}
			}
		}
	}

	private createCssRecord(cssRecord: CssRecord): CssRecord {
		if (this.onPrepareCssRecord) {
			this.onPrepareCssRecord(cssRecord);
		}

		return cssRecord;
	}

	private getUniqueSelectorId(): string {
		return `s${Object.keys(this.selectorsList).length + Object.keys(this.componentsList).length}`;
	}

}

export { CompilationResult };

export default CompilationResult;
