import {
	CssRecord,
	MacroMatch,
	SelectorProperties,
	minifiedSelectorGenerator,
	screensSorter
} from '.';

export type ScreenSortingFunctionType = (screensList: ScreensListMapType) => ScreensListMapType;

export type ScreensListScreenValueType = number|null;

export type ScreensListMapType = Map<string, ScreensListScreenValueType>;

type OnPrepareCssRecordCallbackType = (cssRecord: CssRecord) => void;

export type ScreensListRecordType = Record<string, number>;

export type SelectorsListType = Record<string, CssRecord>

export interface CompilationResultConfigInterface {
	dev?: boolean,
	reconfigurable?: boolean,
	screensSortingFunction?: ScreenSortingFunctionType,
	screensList?: ScreensListRecordType,
	selectorsList?: SelectorsListType,
	componentsList?: string[],
	mangleSelectors?: boolean,
	onPrepareCssRecord?: OnPrepareCssRecordCallbackType,
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

	public constructor(config: CompilationResultConfigInterface = {}) {
		this.addScreen('_');
		this.configure(config);
	}

	public configure(config: CompilationResultConfigInterface = {}): void {
		if (!config || !Object.keys(config).length) {
			return;
		}

		this.dev = config.dev ?? this.dev;
		this.reconfigurable = config.reconfigurable ?? this.reconfigurable;
		this.mangleSelectors = config.mangleSelectors ?? this.mangleSelectors;

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

		this.screensSortingFunction = config.screensSortingFunction ?? screensSorter.sortCssTreeMediaQueries;
		this.onPrepareCssRecord = config.onPrepareCssRecord ?? null;

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
			this.screensList = this.screensSortingFunction(this.screensList);
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

	public bindPlainSelectorsToSelectors(plainSelectorsSelectorsMap: Record<string, string>): void {
		for (const [plainSelector, dependencySelectors] of Object.entries(plainSelectorsSelectorsMap)) {
			for (const dependencySelector of dependencySelectors.split(' ')) {
				if (!(dependencySelector in this.selectorsList)) {
					throw new Error(`Selector "${dependencySelector}" for plainSelector "${plainSelector}" was not matched and therefore not added.`);
				}

				this.selectorsList[dependencySelector].addPlainSelector(plainSelector);
			}
		}
	}

	public bindComponentsToSelectors(selectorsComponentsMap: SelectorsComponentsMapType): void {
		for (const componentDependencySelector in selectorsComponentsMap) {
			for (const componentToBind of selectorsComponentsMap[componentDependencySelector]) {
				if (!(componentDependencySelector in this.selectorsList)) {
					throw new Error(`Selector "${componentDependencySelector}" for component "${componentToBind.component}" was not matched and therefore not added.`);
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
										throw new Error(`Stylify: selector "${selectorFromChain}" from component "${componentToBind.component}" selectorsChain list not found.`);
									}

									selectorFromChain = minifiedSelectorGenerator.getSelector(selectorFromChain);
								}

								return selectorFromChain;
							})
							.join(' ');
					});

				this.selectorsList[componentDependencySelector].addComponent(
					this.mangleSelectors
						? minifiedSelectorGenerator.getSelector(componentToBind.component)
						: componentToBind.component,
					componentToBind.selectorsChain
				);
			}
		}
	}

}
