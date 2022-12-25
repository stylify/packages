import { minifiedSelectorGenerator } from '.';
import { hooks } from '../Hooks';

export interface CssRecordHooksListInterface {
	'cssRecord:addProperty': PropertiesType,
	'cssRecord:cssGenerated': CssRecord
}

export type CssRecordComponentsType = Record<string, string[]>;

export type PropertiesType = Record<string, string>;

export interface CssRecordConfigInterface {
	screenId: number,
	selector: string,
	pseudoClasses: string[],
	utilityShouldBeGenerated: boolean,
	scope?: string,
}

export interface CssRecordCompileParametersConfig {
	minimize: boolean
	mangleSelectors?: boolean
}

export class CssRecord {

	private changed = false;

	private utilityShouldBeGenerated = true;

	public cache: string = null;

	public selector: string = null;

	public mangledSelector: string = null;

	public screenId: number = null;

	public scope: string = null;

	public customSelectors: string[] = [];

	public components: CssRecordComponentsType = {};

	public properties: PropertiesType = {};

	public pseudoClasses: string[] = [];

	constructor(config: CssRecordConfigInterface) {
		this.configure(config);
	}

	public configure(config: Partial<CssRecordConfigInterface> = {}): void {
		if (!Object.keys(config).length) {
			return;
		}

		this.mangledSelector = config.selector
			? minifiedSelectorGenerator.getMangledSelector(config.selector)
			: this.mangledSelector;
		this.screenId = config.screenId ?? this.screenId;
		this.selector = config.selector?.replace(/([^-_a-zA-Z\d])/g, '\\$1') ?? this.selector;
		this.scope = config.scope ?? null;
		this.utilityShouldBeGenerated = config.utilityShouldBeGenerated ?? this.utilityShouldBeGenerated;

		if ((/^\d/gm).test(this.selector[0])) {
			this.selector = '\\3' + this.selector;
		}

		this.addPseudoClasses(config.pseudoClasses ?? []);
		this.changed = true;
	}

	public addProperties(properties: Record<string, string|number>): void {
		for (const property in properties) {
			this.changed = true;
			this.addProperty(property, properties[property]);
		}
	}

	public addProperty(property: string, value: string | number): void {
		if (property in this.properties) {
			return;
		}

		const addPropertyHookData = { [property]: value} as PropertiesType;
		const hookResult = hooks.callHook('cssRecord:addProperty', addPropertyHookData);

		this.changed = true;
		this.properties = {...this.properties, ...hookResult};
	}

	public addPseudoClasses(pseudoClasses: string[] | string): void {
		if (!Array.isArray(pseudoClasses)) {
			pseudoClasses = [pseudoClasses];
		}

		for (const pseudoClass of pseudoClasses) {
			if (!this.pseudoClasses.includes(pseudoClass)) {
				this.changed = true;
				this.pseudoClasses.push(pseudoClass);
			}
		}
	}

	public addCustomSelector(selector: string): void {
		if (this.customSelectors.includes(selector)) {
			return;
		}

		this.customSelectors.push(selector);
	}

	public addComponents(components: CssRecordComponentsType): void {
		for (const componentSelector in components) {
			this.addComponent(componentSelector, components[componentSelector]);
		}
	}

	public addComponent(selector: string, selectorsChain: string[] = []): void {
		selector = selector.replace(/([^-_a-zA-Z\d])/g, '\\$1');

		if (selector in this.components) {
			return;
		}

		this.changed = true;
		this.components[selector] = selectorsChain;
	}

	public generateCss(config: CssRecordCompileParametersConfig): string {
		if (this.changed || !this.cache) {
			const newLine = config.minimize ? '' : '\n';

			const cssRecordSelector = config.mangleSelectors ? this.mangledSelector : this.selector;

			let customSelectors: string[] = [];
			let classSelectors: string[] = [];
			const componentsSelectors: string[] = [];

			for (const componentSelector in this.components) {
				const selectorsChain = this.components[componentSelector];
				if (selectorsChain.length === 1 && (/^\s*$/gm).test(selectorsChain[0])) {
					selectorsChain.pop();
				}

				if (!selectorsChain.length) {
					componentsSelectors.push(componentSelector);
					continue;
				}

				for (let chainedSelectors of selectorsChain) {
					chainedSelectors = chainedSelectors.replace(/\s\s+/g, ' ');
					componentsSelectors.push([...chainedSelectors.split(' '), componentSelector].join('.'));
				}
			}

			if (this.pseudoClasses.length) {
				for (const pseudoClass of this.pseudoClasses) {
					const pseudoClassSuffix = `:${pseudoClass}`;
					customSelectors = this.customSelectors.map((selector: string): string => {
						return `${selector}${pseudoClassSuffix}`;
					});
					classSelectors = [
						...classSelectors,
						...[this.utilityShouldBeGenerated ? `${cssRecordSelector}${pseudoClassSuffix}` : ''],
						...componentsSelectors.map((selector): string => {
							return `${selector}${pseudoClassSuffix}`;
						})
					];
				}

			} else {
				customSelectors = this.customSelectors;
				classSelectors = [this.utilityShouldBeGenerated ? cssRecordSelector : '', ...componentsSelectors];
			}

			const removeEmptyItemsFromArray = (items: string[]) => items.filter(item => item);

			const scopePart = this.scope ? this.scope : '';
			const selectors = [
				...removeEmptyItemsFromArray(customSelectors).map(selector => `${scopePart}${selector}`),
				...removeEmptyItemsFromArray(classSelectors).map(selector=> `${scopePart}.${selector}`)
			];

			const indentation = config.minimize ? '' : '\t';
			const spacing = config.minimize ? '' : ' ';

			this.cache = selectors.join(',' + newLine)
				+ '{' + newLine
					+ Object.keys(this.properties)
						.map(property => `${indentation + property}:${spacing + this.properties[property]}`)
						.join(';' + newLine) + newLine
				+ '}' + newLine;
			this.changed = false;
		}

		hooks.callHook('cssRecord:cssGenerated', this);

		return this.cache;
	}

}
