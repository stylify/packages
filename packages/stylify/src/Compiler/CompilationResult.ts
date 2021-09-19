import { CssRecord, SerializedCssRecordInterface } from './CssRecord';
import MacroMatch from './MacroMatch';
import SelectorProperties from './SelectorProperties';

export interface CompilationResultConfigInterface {
	dev: boolean,
	cssTreeSortingFunction: CallableFunction,
	selectorsList: Record<string, string>,
	mangleSelectors: boolean,
	variables: Record<string, string| number>
}

export interface SerializedCompilationResultInterface {
	mangleSelectors: boolean,
	dev: boolean,
	selectorsList: Record<string, SelectorsListInterface>,
	mangledSelectorsMap: Record<string, string>,
	cssTree: Record<string, Record<string, SerializedCssRecordInterface>>,
	variables: Record<string, string | number>
}

export interface SelectorsListInterface {
	mangledSelector: string,
	processed: boolean
}

class CompilationResult {

	private matchVariableRegExp = /\$([\w-_]+)/g;

	public changed = false

	public mangleSelectors = false;

	public dev = false;

	public mangledSelectorsMap: Record<string, string> = {};

	public selectorsList: Record<string, SelectorsListInterface> = {};

	public cssTree: Map<string, Record<string, CssRecord>> = new Map();

	public cssTreeSortingFunction: CallableFunction = null;

	public variables: Record<string, string | number> = {};

	public lastBuildInfo: Record<string, any> = null;

	public constructor(config: Partial<CompilationResultConfigInterface> = {}) {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this.cssTreeSortingFunction = this.sortCssTreeMediaQueries;
		this.cssTree = new Map();
		this.cssTree.set('_', {});
		this.setBuildInfo(null);
		this.configure(config);
	}

	public configure(config: Partial<CompilationResultConfigInterface> = {}): void {
		this.dev = typeof config.dev === 'undefined' ? this.dev : config.dev;

		this.selectorsList = Object.assign(this.selectorsList, 'selectorsList' in config ? config.selectorsList : {});
		this.mangleSelectors = typeof config.mangleSelectors === 'undefined'
			? this.mangleSelectors
			: config.mangleSelectors;

		this.cssTreeSortingFunction = config.cssTreeSortingFunction || this.cssTreeSortingFunction;
		this.variables = config.variables;
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

		this.lastBuildInfo.processedComponents = this.lastBuildInfo.processedComponents.concat(
			data.processedComponents || []
		);
		this.lastBuildInfo.processedSelectors = this.lastBuildInfo.processedSelectors.concat(
			data.processedSelectors || []
		);
	};

	public generateCss(): string {
		let css = '';
		const newLine = this.dev ? '\n' : '';

		for (const [screenKey, screenValue] of this.cssTree) {
			if (Object.keys(screenValue).length === 0) {
				continue;
			}

			let screenCss = '';

			for (const selector in screenValue) {
				screenCss += screenValue[selector].compile({
					minimize: !this.dev
				});
			}

			css += screenKey === '_' ? screenCss : `${newLine}@media ${screenKey} {${newLine + screenCss}}${newLine}`;
		}

		this.changed = false;
		this.setBuildInfo({
			completed: true
		});
		return css.trim();
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties: SelectorProperties): void {
		const macroResult = selectorProperties.properties;
		const screen = macroMatch.screen;
		const selector = macroMatch.selector;
		const mangledSelectorId = macroMatch.fullMatch in this.selectorsList
			? this.selectorsList[macroMatch.fullMatch].mangledSelector
			: this.getUniqueSelectorId();

		if (!this.cssTree.has(screen)) {
			this.cssTree.set(screen, {});
			this.cssTree = this.cssTreeSortingFunction(this.cssTree);
		} else if (selector in this.cssTree.get(screen)) {
			return;
		}

		const newCssRecord = new CssRecord();
		newCssRecord.addPseudoClasses(macroMatch.pseudoClasses);
		const selectorToAdd = this.mangleSelectors ? mangledSelectorId : selector;

		for (const property in macroResult) {
			const propertyValue = macroResult[property].replace(
				this.matchVariableRegExp,
				(match, substring): string => {
					return String(this.variables[substring]);
				}
			);
			newCssRecord.addProperty(property, propertyValue);
		}

		this.cssTree.get(screen)[selector] = newCssRecord;

		this.addSelectorIntoCssTree(screen, selector, selectorToAdd);

		this.changed = true;

		this.setBuildInfo({
			processedSelectors: [selector]
		});

		this.addSelectorIntoList(macroMatch.fullMatch, mangledSelectorId, true);
	}

	private addSelectorIntoList(selector, mangledSelector, processed): void {
		this.selectorsList[selector] = {
			mangledSelector: mangledSelector,
			processed: processed
		};

		this.mangledSelectorsMap[mangledSelector] = selector;
	}

	public bindComponentsSelectors(componentsSelectorsMap: Record<string, any>): void {
		const processedComponents = [];

		for (const [screen, selectors] of this.cssTree) {
			Object.keys(selectors).forEach((selector: string): void => {
				if (selector in componentsSelectorsMap) {
					componentsSelectorsMap[selector].forEach(componentSelector => {
						if (!(componentSelector in this.selectorsList)) {
							this.addSelectorIntoList(componentSelector, this.getUniqueSelectorId(), true);
						}

						const selectorToAdd = this.mangleSelectors
							? this.selectorsList[componentSelector].mangledSelector
							: componentSelector;

						if (processedComponents.indexOf(componentSelector) === -1) {
							processedComponents.push(componentSelector);
						}

						this.addSelectorIntoCssTree(screen, selector, selectorToAdd);
					});
				}
			});
		}

		this.setBuildInfo({
			processedComponents: processedComponents
		});
	}

	private sortCssTreeMediaQueries(
		cssTree: Map<string, Record<string, CssRecord>>
	): Map<string, Record<string, CssRecord>> {
		const newCssTree: Map<string, Record<string, CssRecord>> = new Map();
		newCssTree.set('_', cssTree.get('_'));
		cssTree.delete('_');

		let cssTreeKeysArray = [...cssTree.keys()];

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
				newCssTree.set(sortedKey, cssTree.get(sortedKey));
				cssTree.delete(sortedKey);
			}
		};

		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'min-width');
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'min-height');
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'max-width', true);
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'max-height', true);
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'min-device-width');
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'min-device-height');
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'max-device-width', true);
		cssTreeKeysArray = separateAndSort(cssTreeKeysArray, 'max-device-height', true);
		mapSortedKeys(cssTreeKeysArray);

		return newCssTree;
	}

	public addSelectorIntoCssTree(screen: string, selector: string, selectorToAdd: string): void {
		const cssRecord = this.cssTree.get(screen)[selector];

		if (cssRecord.pseudoClasses.length > 0) {
			cssRecord.pseudoClasses.forEach((pseudoClass: string): void => {
				cssRecord.addSelector(selectorToAdd, pseudoClass);
			});
			return;
		}

		cssRecord.addSelector(selectorToAdd);
	}

	public serialize(): SerializedCompilationResultInterface {
		const serializedCompilationResult: SerializedCompilationResultInterface = {
			mangleSelectors: this.mangleSelectors,
			dev: this.dev,
			selectorsList: this.selectorsList,
			mangledSelectorsMap: this.mangledSelectorsMap,
			cssTree: {},
			variables: this.variables
		};

		for (const [screen, screenSelectors] of this.cssTree) {
			if (!Object.keys(screenSelectors).length) {
				continue;
			}

			serializedCompilationResult.cssTree[screen] = {};
			Object.keys(screenSelectors).forEach(selector => {
				serializedCompilationResult.cssTree[screen][selector] = screenSelectors[selector].serialize();
			});
		}

		return serializedCompilationResult;
	}

	public static deserialize(data: Required<SerializedCompilationResultInterface>): CompilationResult {
		const compilationResult = new CompilationResult({
			dev: data.dev,
			variables: data.variables,
			mangleSelectors: data.mangleSelectors
		});

		compilationResult.selectorsList = data.selectorsList || {};
		compilationResult.mangledSelectorsMap = data.mangledSelectorsMap || {};

		if ('cssTree' in data) {
			Object.keys(data.cssTree).forEach((screen: string): void => {
				Object.keys(data.cssTree[screen]).forEach((selector: string): void => {
					const serializedSelectorData = data.cssTree[screen][selector];

					if (!compilationResult.cssTree.has(screen)) {
						compilationResult.cssTree.set(screen, {});
					}

					compilationResult.cssTree.get(screen)[selector] = new CssRecord(
						serializedSelectorData.selectors,
						serializedSelectorData.properties,
						serializedSelectorData.pseudoClasses
					);
				});
			});
		}

		return compilationResult;
	}

	public hydrate(data: Required<SerializedCompilationResultInterface>): void {
		this.selectorsList = Object.assign(this.selectorsList, data.selectorsList || {});
		this.mangledSelectorsMap = Object.assign(this.mangledSelectorsMap, data.mangledSelectorsMap || {});

		Object.keys(data.cssTree).forEach(screen => {
			Object.keys(data.cssTree[screen]).forEach(selector => {
				const serializedSelectorData = data.cssTree[screen][selector];
				this.cssTree.get(screen)[selector].hydrate(serializedSelectorData);
			});
		});
	}

	private getUniqueSelectorId(): string {
		return `s${Object.keys(this.selectorsList).length}`;
	}

}

export { CompilationResult };

export default CompilationResult;
