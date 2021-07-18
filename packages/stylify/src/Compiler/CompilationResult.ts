// @ts-nocheck

import CssRecord from './CssRecord';
import MacroMatch from './MacroMatch';

export default class CompilationResult {

	private MATCH_VARIABLE_REG_EXP = /\$([\w-_]+)/g;

	public changed = false

	public mangleSelectors = false;

	public dev = false

	public screens: Record<string, any> = {};

	public mangledSelectorsMap: Record<string, any> = {};

	public selectorsList: Record<string, any> = {};

	public cssTree: Record<string, any> = {
		_: {}
	};

	public variables: Record<string, any> = {};

	public lastBuildInfo: Record<string, any> = null;

	public constructor(config: Record<string, any> = {}) {
		this.setBuildInfo(null);
		this.configure(config);
	}

	public configure(config: Record<string, any> = {}) {
		this.dev = typeof config.dev === 'undefined' ? this.dev : config.dev;
		this.screens = config.screens || this.screens;
		this.selectorsList = Object.assign(this.selectorsList, 'selectorsList' in config ? config.selectorsList : {});
		// TODO always generate short id?
		this.mangleSelectors = typeof config.mangleSelectors === 'undefined' ? this.mangleSelectors : config.mangleSelectors;
		this.variables = config.variables;

		// TODO block keys sorting - keep order given by developer
		Object.keys(this.screens).forEach(screenKey => {
			this.cssTree[screenKey] = this.cssTree[screenKey] || {};
		});
	}

	private setBuildInfo = (data: Record<string, any> = null) => {
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

		// Přenést tuto funkci do generateCssForScreens
		// Vrátit objekt s csskem
		// Mergnout, trimnout, vrátit string
		for (const screenKey in this.cssTree) {
			if (Object.keys(this.cssTree[screenKey]).length === 0) {
				continue;
			}
			let screenCss = '';
			const screenOpen = screenKey === '_' ? '' : this.screens[screenKey] + '{';
			const screenClose = '}';

			for (const selector in this.cssTree[screenKey]) {
				screenCss += this.cssTree[screenKey][selector].compile({
					minimize: !this.dev
				});
			}

			css += screenKey === '_' ? screenCss : screenOpen + screenCss + screenClose;
		}

		this.changed = false;
		this.setBuildInfo({
			completed: true
		});
		return css.trim();
	}

	// Generate css for each screen
	// Možné potom použít pro linky, css se načte separátně jako soubor
	public generateCssForScreens() {
		this.changed = false;
		this.setBuildInfo({
			completed: true
		})
		return {
			screen: 'css'
		};
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties): void {
		const macroResult = selectorProperties.properties;
		const screen = macroMatch.screen;
		const selector = macroMatch.selector;
		const mangledSelectorId = macroMatch.fullMatch in this.selectorsList
			? this.selectorsList[macroMatch.fullMatch].mangledSelector
			: this.getUniqueSelectorId();

		if (typeof this.cssTree[screen] === 'undefined') {
			this.cssTree[screen] = {};
		}

		if (selector in this.cssTree[screen]) {
			return;
		}

		const newCssRecord = new CssRecord();
		newCssRecord.pseudoClasses = macroMatch.pseudoClasses;
		const selectorToAdd = this.mangleSelectors ? mangledSelectorId : selector;

		for (const property in macroResult) {
			const propertyValue = macroResult[property].replace(
				this.MATCH_VARIABLE_REG_EXP,
				(match, substring) => {
					return this.variables[substring];
				}
			);
			newCssRecord.addProperty(property, propertyValue);
		}

		this.cssTree[screen][selector] = newCssRecord;
		this.addSelectorIntoCssTree(screen, selector, selectorToAdd);

		this.changed = true;

		this.setBuildInfo({
			processedSelectors: [selector]
		});

		this.addSelectorIntoList(macroMatch.fullMatch, mangledSelectorId, true);
	}

	private addSelectorIntoList(selector, mangledSelector, processed) {
		this.selectorsList[selector] = {
			mangledSelector: mangledSelector,
			processed: processed
		}

		this.mangledSelectorsMap[mangledSelector] = selector;
	}

	public bindComponentsSelectors(componentsSelectorsMap: Record<string, any>) {
		const processedComponents = [];

		Object.keys(this.cssTree).forEach((screen) => {
			Object.keys(this.cssTree[screen]).forEach((selector) => {
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
		});

		this.setBuildInfo({
			processedComponents: processedComponents
		});

	}

	public addSelectorIntoCssTree(screen: string, selector: string, selectorToAdd: string): void {
		const cssRecord = this.cssTree[screen][selector];

		if (cssRecord.pseudoClasses.length > 0) {
			cssRecord.pseudoClasses.forEach((pseudoClass) => {
				cssRecord.addSelector(selectorToAdd, pseudoClass);
			});
			return;
		}

		cssRecord.addSelector(selectorToAdd);
	}

	public serialize(): Record<string, any> {
		const serializedCompilationResult = {
			mangleSelectors: this.mangleSelectors,
			dev: this.dev,
			screens: this.screens,
			selectorsList: this.selectorsList,
			mangledSelectorsMap: this.mangledSelectorsMap,
			cssTree: {},
			variables: this.variables
		};

		Object.keys(this.cssTree).forEach(screen => {
			serializedCompilationResult.cssTree[screen] = {};
			Object.keys(this.cssTree[screen]).forEach(selector => {
				serializedCompilationResult.cssTree[screen][selector] = this.cssTree[screen][selector].serialize();
			});
		});

		return serializedCompilationResult;
	}

	public static deserialize(data: Record<string, any>): CompilationResult {
		const compilationResult = new CompilationResult({
			dev: data.dev,
			screens: data.screens,
			variables: data.variables,
			mangleSelectors: data.mangleSelectors
		});

		compilationResult.selectorsList = data.selectorsList || {};
		compilationResult.mangledSelectorsMap = data.mangledSelectorsMap || {};

		if ('cssTree' in data) {
			Object.keys(data.cssTree).forEach(screen => {
				Object.keys(data.cssTree[screen]).forEach(selector => {
					const serializedSelectorData = data.cssTree[screen][selector];

					compilationResult.cssTree[screen][selector] = new CssRecord(
						serializedSelectorData.selectors,
						serializedSelectorData.properties,
						serializedSelectorData.pseudoClasses
					);
				});
			});
		}

		return compilationResult;
	}

	// Co když css bude vygenerované do souborů?
	// <style> element bude jen pro vygenerované věci z runtime?
	// Něco jako negeneruj dané selektory, protože jsou v externích souborech
	public hydrate(data: Record<string, any>) {
		this.selectorsList = Object.assign(this.selectorsList, data.selectorsList || {});
		this.mangledSelectorsMap = Object.assign(this.mangledSelectorsMap, data.mangledSelectorsMap || {});

		Object.keys(data.cssTree).forEach(screen => {
			Object.keys(data.cssTree[screen]).forEach(selector => {
				const serializedSelectorData = data.cssTree[screen][selector];
				this.cssTree[screen][selector].hydrate(serializedSelectorData);
			});
		});

	}

	private getUniqueSelectorId(): string {
		return 's' + Object.keys(this.selectorsList).length;
	}

}
