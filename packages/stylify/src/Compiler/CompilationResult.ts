import {
	CssRecord,
	MacroMatch,
	SelectorProperties,
	screensSorter
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

	private screensListSorted = false;

	public reconfigurable = true;

	public changed = false;

	public mangleSelectors = false;

	public dev = false;

	public selectorsList: Record<string, CssRecord> = {};

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
			pseudoClasses: macroMatch.pseudoClasses
		});

		hooks.callHook('compilationResult:configureCssRecord', {compilationResult: this, cssRecord: newCssRecord});

		newCssRecord.addProperties(selectorProperties.properties);

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
