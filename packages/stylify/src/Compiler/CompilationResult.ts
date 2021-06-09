import CssRecord from "./CssRecord";
import MacroMatch from "./MacroMatch";

export default class CompilationResult {

	private MATCH_VARIABLE_REG_EXP = /\$([\w-_]+)/g;

	public changed: boolean = false

	public mangleSelectors = false;

	public dev: boolean = false

	public screens: Record<string, any> = {};

	public processedSelectors: Record<string, any> = {};

	public cssTree: Record<string, any> = {};

	public variables: Record<string, any> = {};

	public lastBuildInfo: Record<string, any> = null;

	public constructor(config: Record<string, any> = {}) {
		this.configure(config);
	}

	public configure(config: Record<string, any> = {}) {
		this.dev = config.dev || this.dev;
		this.screens = config.screens || this.screens;
		// TODO always generate short id?
		this.mangleSelectors = config.mangleSelectors || this.mangleSelectors;
		this.variables = config.variables;

		Object.keys(this.screens).forEach(screenKey => {
			this.cssTree[screenKey] = this.cssTree[screenKey] || {};
		});
	}

	private setBuildInfo = (data: Record<string, any> = null) => {
		if (!this.dev) {
			return;
		}

		if (data === null
			|| this.lastBuildInfo === null
			|| (this.changed === true && this.lastBuildInfo.completed === true)
		) {
			this.lastBuildInfo = {
				processedSelectors: [],
				processedComponents: [],
				completed: false
			}
		}

		if (data === null) {
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

		//posunutí class pro všechno na začátek a 
		//mq na konec tak ja jdou za sebou
		let cssTreeKeys = Object.keys(this.cssTree);
		if (cssTreeKeys.length > 1) {
			cssTreeKeys.pop();
			cssTreeKeys.unshift('_');
		}

		for (const screenKey of cssTreeKeys) {
			if (Object.keys(this.cssTree[screenKey]).length === 0) {
				continue;
			}
			let screenCss = '';
			const screenOpen = screenKey === '_' ? '' : this.screens[screenKey] + '{'
			const screenClose = '}';

			for (let selector in this.cssTree[screenKey]) {
				screenCss += this.cssTree[screenKey][selector].compile({
					minimize: !this.dev
				});
			};

			css += screenKey === '_' ? screenCss : screenOpen + screenCss + screenClose;
		};

		this.changed = false;
		this.lastBuildInfo = {};
		this.lastBuildInfo.completed = true;
		return css.trim();
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties): void {
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
		newCssRecord.pseudoClasses = macroMatch.pseudoClasses
		const selectorToAdd = this.mangleSelectors ? mangledSelectorId : selector;

		for (let property in macroResult) {
			const propertyValue = macroResult[property].replace(
				this.MATCH_VARIABLE_REG_EXP,
				(match, substring) => {
					return this.variables[substring];
				}
			);
			newCssRecord.addProperty(property, propertyValue);
		}

		this.cssTree[screen][selector] = newCssRecord;
		this.addSelectorIntoCssTree(screen, selector, selectorToAdd)

		this.changed = true;

		this.setBuildInfo({
			processedSelectors: [selector]
		});

		this.processedSelectors[macroMatch.fullMatch] = mangledSelectorId;
	}

	public bindComponentsSelectors(componentsSelectorsMap: Record<string, any>) {
		const processedComponents = [];

		Object.keys(this.cssTree).forEach((screen) => {
			Object.keys(this.cssTree[screen]).forEach((selector) => {
				if (selector in componentsSelectorsMap) {
					componentsSelectorsMap[selector].forEach(componentSelector => {
						let selectorToAdd = componentSelector;

						if (this.mangleSelectors) {
							if (!(componentSelector in this.processedSelectors)) {
								this.processedSelectors[componentSelector] = this.getUniqueSelectorId();
							}
							selectorToAdd = this.processedSelectors[componentSelector];
						}

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

	private getUniqueSelectorId(): string {
		return 's' + Object.keys(this.processedSelectors).length;
	}

}
