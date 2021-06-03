// @ts-nocheck

import CssRecord from './CssRecord';
import MacroMatch from './MacroMatch';
import SelectorProperties from './SelectorProperties';

export default class CompilationResult {

	private MATCH_VARIABLE_REG_EXP = /\$([\w-_]+)/g;

	public changed = false

	public mangleSelectors = false;

	public dev = false

	public screens: Record<string, any> = {};

	public processedSelectors: Record<string, string> = {};

	public cssTree: Record<string, Record<string, CssRecord>|Record<string, never>> = {
		_: {}
	};

	public variables: Record<string, any> = {};

	public lastBuildInfo: Record<string, string[]> = null;

	public constructor(config: Record<string, any> = {}) {
		this.setBuildInfo(null);
		this.configure(config);
	}

	public configure(config: Record<string, boolean> = {}): void {
		this.dev = config.dev || this.dev;
		this.screens = config.screens || this.screens;
		// TODO always generate short id?
		this.mangleSelectors = config.mangleSelectors || this.mangleSelectors;
		this.variables = config.variables;

		// TODO block keys sorting - keep order given by developer
		Object.keys(this.screens).forEach(screenKey => {
			this.cssTree[screenKey] = this.cssTree[screenKey] || {};
		});
	}

	private setBuildInfo = (data: Record<string, string[]> = null) => {
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
		this.lastBuildInfo.completed = true;
		return css.trim();
	}

	// Generate css for each screen
	// Možné potom použít pro linky, css se načte separátně jako soubor
	public generateCssForScreens(): {screen: string} {
		this.changed = false;
		this.lastBuildInfo.completed = true;
		return {
			screen: 'css'
		};
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties: SelectorProperties): void {
		const macroResult = selectorProperties.properties;
		const screen = macroMatch.screen;
		const selector = macroMatch.selector;
		const mangledSelectorId = this.getUniqueSelectorId();

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
			const propertyValue: string = macroResult[property].replace(
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

		this.processedSelectors[macroMatch.fullMatch] = mangledSelectorId;
	}

	public bindComponentsSelectors(componentsSelectorsMap: Record<string, any>): void {
		const processedComponents: string[] = [];

		Object.keys(this.cssTree).forEach((screen) => {
			Object.keys(this.cssTree[screen]).forEach((selector) => {
				if (selector in componentsSelectorsMap) {
					componentsSelectorsMap[selector].forEach((componentSelector: string) => {
						if (!(componentSelector in this.processedSelectors)) {
							this.processedSelectors[componentSelector] = this.getUniqueSelectorId();
						}
						//this.processedSelectors[componentSelector] - možná něco společného s Profiler components
						const selectorToAdd: string = this.mangleSelectors
							? this.processedSelectors[componentSelector]
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
			processedSelectors: this.processedSelectors,
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
		//nevím volá se to když v Runtime.ts je compilerResults false
		const compilationResult = new CompilationResult({
			dev: data.dev,
			screens: data.screens,
			variables: data.variables,
			mangleSelectors: data.mangleSelectors
		});

		compilationResult.processedSelectors = data.processedSelectors;

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

		return compilationResult;
	}

	// Co když css bude vygenerované do souborů?
	// <style> element bude jen pro vygenerované věci z runtime?
	// Něco jako negeneruj dané selektory, protože jsou v externích souborech
	//nešlo spustit napsal jsem to tak jak by to odpovídalo podle kódu
	public hydrate(data: Record<string, Record<string, string>|Record<string, Record<string, string>>>): void {
		this.processedSelectors = Object.assign(this.processedSelectors, data.processedSelectors);

		Object.keys(data.cssTree).forEach(screen => {
			Object.keys(data.cssTree[screen]).forEach(selector => {
				const serializedSelectorData: string = data.cssTree[screen][selector];
				this.cssTree[screen][selector].hydrate(serializedSelectorData);
			});
		});
	}

	private getUniqueSelectorId(): string {
		return 's' + Object.keys(this.processedSelectors).length;
	}

}
