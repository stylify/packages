export interface SerializedCssRecordInterface {
	screenId: number,
	selector: string,
	mangledSelector: string,
	properties?: Record<string, string | number>,
	components?: string[],
	pseudoClasses?: string[],
	onAddProperty?: string
	scope?: string
}

export interface CssRecordConfigInterface {
	screenId: number,
	selector: string,
	mangledSelector: string,
	properties?: Record<string, string | number>,
	components?: string[],
	pseudoClasses?: string[],
	onAddProperty?: CallableFunction | string
	scope?: string
	shouldBeGenerated?: boolean
}

export interface CssRecordCompileParametersConfig {
	minimize: boolean
	mangleSelectors?: boolean
}

export class CssRecord {

	private cache: string = null;

	private changed = false;

	public shouldBeGenerated = false;

	public mangledSelector: string = null;

	public selector: string = null;

	public screenId: number = null;

	public scope: string = null;

	public components: string[] = [];

	public properties: Record<string, string | number> = {};

	public pseudoClasses: string[] = [];

	public onAddProperty: CallableFunction = null;

	constructor(config: CssRecordConfigInterface) {
		this.configure(config);
	}

	public configure(config: CssRecordConfigInterface): void {
		this.screenId = config.screenId;
		this.selector = config.selector.replace(/([^-_a-zA-Z\d])/g, '\\$1');
		this.mangledSelector = config.mangledSelector;
		this.scope = config.scope || null;
		if ('onAddProperty' in config) {
			this.onAddProperty = typeof config.onAddProperty === 'string'
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				? new Function(config.onAddProperty)
				: config.onAddProperty;
		}
		this.shouldBeGenerated = 'shouldBeGenerated' in config ? config.shouldBeGenerated : this.shouldBeGenerated;
		this.addComponents(config.components || []);
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
			let properties = this.onAddProperty
				? this.onAddProperty(property, value) as Record<string, any>|null
				: null;

			if (!properties) {
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

	public addComponents(selectors: string[]): void {
		for (const selector of selectors) {
			this.addComponent(selector);
		}
	}

	public addComponent(selector: string): void {
		selector = selector.replace(/([^-_a-zA-Z\d])/g, '\\$1');

		if (this.components.includes(selector)) {
			return;
		}

		this.changed = true;
		this.components.push(selector);
	}

	public generateCss(config: CssRecordCompileParametersConfig): string {
		if (this.changed || !this.cache) {
			const newLine = config.minimize ? '' : '\n';
			const scopePart = this.scope ? this.scope + ' ' : '';

			const cssRecordSelector = config.mangleSelectors ? this.mangledSelector : this.selector;
			let selectors: string[] = [];

			if (this.pseudoClasses.length) {
				for (const pseudoClass of this.pseudoClasses) {
					const pseudoClassSuffix = `:${pseudoClass}`;
					selectors.push(`${cssRecordSelector}${pseudoClassSuffix}`);

					for (const component of this.components) {
						selectors.push(`${component}${pseudoClassSuffix}`);
					}
				}
			} else {
				selectors = [cssRecordSelector, ...this.components];
			}

			this.cache = selectors
				.map((selector): string => {
					return `${scopePart}.${selector}`;
				})
				.join(',' + newLine) + '{' + newLine
				+ Object.keys(this.properties)
					.map(property => `${(config.minimize ? '' : '\t') + property}:${this.properties[property]}`)
					.join(';' + newLine)
				+ newLine + '}' + newLine;
			this.changed = false;
		}

		return this.cache;
	}

	public serialize(): SerializedCssRecordInterface {
		const serializedObject: SerializedCssRecordInterface = {
			screenId: this.screenId,
			selector: this.selector.replace(/\\([^-_a-zA-Z\d])/g, '$1'),
			properties: this.properties,
			mangledSelector: this.mangledSelector
		};

		if (this.components.length) {
			serializedObject.components = [];
			for (const component of this.components) {
				serializedObject.components.push(component.replace(/\\([^-_a-zA-Z\d])/g, '$1'));
			}
		}

		if (this.onAddProperty) {
			serializedObject.onAddProperty = this.onAddProperty.toString();
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
