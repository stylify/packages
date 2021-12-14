import { stringHashCode } from './stringHashCode';

export interface SerializedCssRecordInterface {
	screenId: number,
	selector: string,
	properties?: Record<string, string | number>,
	plainSelectors?: string[],
	components?: ComponentsType,
	pseudoClasses?: string[],
	onAddProperty?: string
	onAfterGenerate?: string,
	scope?: string
}

export type ComponentsType = Record<string, string[]>;

export type OnAddPropertyCallbackType = (property: string, value: any) => Record<string, any>|null;

export type OnAfterGenerateCallbackType = (cssRecord: CssRecord) => void;

export interface CssRecordConfigInterface {
	screenId?: number,
	selector?: string,
	properties?: Record<string, string | number>,
	plainSelectors?: string[],
	components?: ComponentsType,
	pseudoClasses?: string[],
	onAddProperty?: OnAddPropertyCallbackType | string,
	onAfterGenerate?: OnAfterGenerateCallbackType | string,
	scope?: string,
	shouldBeGenerated?: boolean
}

export interface CssRecordCompileParametersConfig {
	minimize: boolean
	mangleSelectors?: boolean
}

export class CssRecord {

	private changed = false;

	public cache: string = null;

	public shouldBeGenerated = false;

	public selector: string = null;

	public mangledSelector: string = null;

	public screenId: number = null;

	public scope: string = null;

	public plainSelectors: string[] = [];

	public components: ComponentsType = {};

	public properties: Record<string, string | number> = {};

	public pseudoClasses: string[] = [];

	public onAddProperty: OnAddPropertyCallbackType = null;

	public onAfterGenerate: OnAfterGenerateCallbackType = null;

	constructor(config: CssRecordConfigInterface = {}) {
		if (!Object.keys(config).length) {
			return;
		}
		this.configure(config);
	}

	public configure(config: CssRecordConfigInterface): void {
		this.screenId = config.screenId;
		this.selector = config.selector.replace(/([^-_a-zA-Z\d])/g, '\\$1');
		this.mangledSelector = stringHashCode(this.selector);
		this.scope = config.scope || null;
		if ('onAddProperty' in config) {
			this.onAddProperty = typeof config.onAddProperty === 'string'
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				? new Function(config.onAddProperty) as OnAddPropertyCallbackType
				: config.onAddProperty;
		}
		this.shouldBeGenerated = 'shouldBeGenerated' in config ? config.shouldBeGenerated : this.shouldBeGenerated;
		this.addComponents(config.components || {});
		this.addProperties(config.properties || {});
		this.addPseudoClasses(config.pseudoClasses || []);
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

		const onAddPropertyHook = (property: string, value: any): Record<string, any> => {
			let properties = this.onAddProperty ? this.onAddProperty(property, value) : null;

			if (!properties || typeof properties === 'undefined') {
				properties = {
					[property]: value
				};
			}

			return properties;
		};

		this.changed = true;
		this.properties = {...this.properties, ...onAddPropertyHook(property, value)};
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

	public addPlainSelector(selector: string): void {
		if (this.plainSelectors.includes(selector)) {
			return;
		}

		this.plainSelectors.push(selector);
	}

	public addComponents(components: ComponentsType): void {
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

			const cssRecordSelector = config.mangleSelectors ? stringHashCode(this.selector) : this.selector;

			let plainSelectors: string[] = [];
			let classSelectors: string[] = [];
			const componentsSelectors: string[] = [];

			for (const componentSelector in this.components) {
				const selectorsChain = this.components[componentSelector];
				if (!selectorsChain.length) {
					componentsSelectors.push(componentSelector);
					continue;
				}

				for (const chainedSelectors of selectorsChain) {
					componentsSelectors.push([...chainedSelectors.split(' '), componentSelector].join('.'));
				}
			}

			if (this.pseudoClasses.length) {
				for (const pseudoClass of this.pseudoClasses) {
					const pseudoClassSuffix = `:${pseudoClass}`;
					plainSelectors = this.plainSelectors.map((selector: string): string => {
						return `${selector}${pseudoClassSuffix}`;
					});
					classSelectors = [
						...classSelectors,
						...[`${cssRecordSelector}${pseudoClassSuffix}`],
						...componentsSelectors.map((selector): string => {
							return `${selector}${pseudoClassSuffix}`;
						})
					];
				}

			} else {
				plainSelectors = this.plainSelectors;
				classSelectors = [cssRecordSelector, ...componentsSelectors];
			}

			const scopePart = this.scope ? this.scope : '';
			const selectors = [
				...plainSelectors.map((selector): string => {
					return `${scopePart}${selector}`;
				}),
				...classSelectors.map((selector): string => {
					return `${scopePart}.${selector}`;
				})
			];

			this.cache = selectors.join(',' + newLine)
				+ '{' + newLine
					+ Object.keys(this.properties)
						.map(property => `${(config.minimize ? '' : '\t') + property}:${this.properties[property]}`)
						.join(';' + newLine) + newLine
				+ '}' + newLine;
			this.changed = false;
		}

		if (this.onAfterGenerate) {
			this.onAfterGenerate(this);
		}

		return this.cache;
	}

	public serialize(): SerializedCssRecordInterface {
		const serializedObject: SerializedCssRecordInterface = {
			screenId: this.screenId,
			selector: this.selector.replace(/\\([^-_a-zA-Z\d])/g, '$1'),
			properties: this.properties
		};

		if (Object.keys(this.components).length) {
			serializedObject.components = {};
			for (const componentSelector in this.components) {
				const selectorsChain = this.components[componentSelector];
				serializedObject.components[componentSelector.replace(/\\([^-_a-zA-Z\d])/g, '$1')] = selectorsChain;
			}
		}

		if (this.plainSelectors.length) {
			serializedObject.plainSelectors = this.plainSelectors;
		}

		if (this.onAddProperty) {
			serializedObject.onAddProperty = this.onAddProperty.toString();
		}

		if (this.onAfterGenerate) {
			serializedObject.onAfterGenerate = this.onAfterGenerate.toString();
		}

		if (this.scope) {
			serializedObject.scope = this.scope;
		}

		if (this.pseudoClasses.length) {
			serializedObject.pseudoClasses = this.pseudoClasses;
		}

		return serializedObject;
	}

}
