import {
	CssRecord,
	MacroMatch,
	screensSorter,
	CssRecordConfigInterface,
	minifiedSelectorGenerator,
	MacroCallbackReturnType
} from '.';

import { hooks } from '../Hooks';
import { createUId } from '../Utilities';

export interface ConfigurCssRecordHookDataInterface {
	compilationResult: CompilationResult,
	cssRecord: CssRecord
}

export interface CompilationResultHooksListInterface {
	'compilationResult:configureCssRecord': ConfigurCssRecordHookDataInterface,
}

export type ScreenSortingFunctionType = (screensList: ScreensListMapType) => ScreensListMapType;

export type ScreensListScreenValueType = number|null;

export type ScreensListMapType = Map<string, ScreensListScreenValueType>;

export type ScreensListRecordType = Record<string, number>;

export type SelectorsListType = Record<string, CssRecord>

export interface CompilationResultConfigInterface {
	dev?: boolean,
	reconfigurable?: boolean,
	screensSortingFunction?: ScreenSortingFunctionType,
	screensList?: ScreensListRecordType,
	mangleSelectors?: boolean,
	mangledSelectorsPrefix?: string,
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

	public readonly id: string;

	private screensList: ScreensListMapType = new Map();

	private selectorsList: Record<string, CssRecord> = {};

	private screensListSorted = false;

	public reconfigurable = true;

	public changed = false;

	public mangleSelectors = false;

	public mangledSelectorsPrefix = '';

	public dev = false;

	public screensSortingFunction: ScreenSortingFunctionType = null;

	public defaultCss = '';

	public constructor(config: CompilationResultConfigInterface = {}) {
		this.id = createUId();
		this.addScreen('_');
		this.configure(config);
	}

	public configure(config: CompilationResultConfigInterface = {}): void {
		if (!Object.keys(config).length) {
			return;
		}

		this.dev = config.dev ?? this.dev;
		this.reconfigurable = config.reconfigurable ?? this.reconfigurable;
		this.mangleSelectors = config.mangleSelectors ?? this.mangleSelectors;
		this.mangledSelectorsPrefix = config.mangledSelectorsPrefix ?? this.mangledSelectorsPrefix;
		this.defaultCss = config.defaultCss || this.defaultCss;

		this.screensSortingFunction = config.screensSortingFunction ?? screensSorter.sortCssTreeMediaQueries;
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

	public generateCss(): string {
		let css = this.defaultCss;

		const newLine = this.dev ? '\n' : '';
		const cssTree: Record<string, string> = {};

		const sortedSelectors = Object.keys(this.selectorsList).sort((a, b) => {
			const cssRecordA = this.selectorsList[a];
			const cssRecordB = this.selectorsList[b];

			let propertiesComparisonArray: string[] = [];
			let propertyAForComparison = null;

			const cssRecordAProps = cssRecordA.getSortedPropertiesKeys();
			const cssRecordBProps = cssRecordB.getSortedPropertiesKeys();

			for (let i = 0; i < cssRecordAProps.length; i++) {
				const propertyOfA = cssRecordAProps[i];
				const propertyOfB = cssRecordBProps[i];

				if (propertyOfB === undefined || propertyOfA === propertyOfB) {
					continue;
				}

				propertyAForComparison = propertyOfA;
				propertiesComparisonArray = [propertyOfA, propertyOfB];
				break;
			}

			if (propertiesComparisonArray.length === 0) {
				return 0;
			}

			const firstItem = propertiesComparisonArray.sort()[0];

			return firstItem === propertyAForComparison ? -1 : 1;
		});

		for (const selector of sortedSelectors) {
			const cssRecord = this.selectorsList[selector];
			const screen = this.getScreenById(cssRecord.screenId);

			if (!(screen in cssTree)) {
				cssTree[screen] = '';
			}

			cssTree[screen] += this.selectorsList[selector].generateCss({
				minimize: !this.dev,
				mangleSelectors: this.mangleSelectors,
				mangledSelectorsPrefix: this.mangledSelectorsPrefix
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

	public getCssRecord(macroMatch: MacroMatch): CssRecord|null {
		return this.selectorsList[macroMatch.fullMatch] ?? null;
	}

	public configureCssRecord(cssRecord: CssRecord, config: Partial<CssRecordConfigInterface>): void {
		cssRecord.configure(config);
		this.changed = true;
	}

	public addCssRecord(
		macroMatch: MacroMatch,
		selectorProperties: MacroCallbackReturnType,
		utilityShouldBeGenerated = true
	): void {
		if (macroMatch.fullMatch in this.selectorsList) {
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
			mangledSelector: `${this.mangledSelectorsPrefix}${minifiedSelectorGenerator.generateMangledSelector(selector)}`,
			pseudoClasses: macroMatch.pseudoClasses ? [macroMatch.pseudoClasses] : [],
			utilityShouldBeGenerated
		});

		hooks.callHook('compilationResult:configureCssRecord', {compilationResult: this, cssRecord: newCssRecord});

		newCssRecord.addProperties(selectorProperties);

		this.selectorsList[selector] = newCssRecord;
		this.changed = true;
	}

	public bindCustomSelectorsToSelectors(customSelectorsSelectorsMap: Record<string, string>): void {
		for (const [customSelector, dependencySelectors] of Object.entries(customSelectorsSelectorsMap)) {
			for (const dependencySelector of dependencySelectors.split(' ').filter((item) => item.trim() !== '')) {
				if (!(dependencySelector in this.selectorsList)) {
					throw new Error(`Selector "${dependencySelector}" for custom selector "${customSelector}" was not matched and therefore not added.`);
				}

				this.selectorsList[dependencySelector].addCustomSelector(customSelector);
			}
		}
	}

}
