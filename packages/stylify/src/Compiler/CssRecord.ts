export interface SerializedCssRecordInterface {
	selectors: string[],
	properties: Record<string, string | number>,
	pseudoClasses?: string[],
	onAddProperty?: string
	scope?: string
}

export interface CssRecordConfigInterface {
	selectors?: string|string[],
	properties?: Record<string, string | number>,
	pseudoClases?: string[],
	onAddProperty?: CallableFunction
	scope?: string
}

export interface CssRecordCompileParametersConfig {
	minimize: boolean
}

class CssRecord {

	public scope: string = null;

	public selectors: string[] = [];

	public properties: Record<string, string | number> = {};

	public pseudoClasses: string[] = [];

	public onAddProperty: CallableFunction = null;

	constructor(config: CssRecordConfigInterface = {}) {
		this.configure(config);
	}

	public configure(config: CssRecordConfigInterface): void {
		if ('selectors' in config) {
			config.selectors = Array.isArray(config.selectors) ? config.selectors : [config.selectors];

			for (const selector of config.selectors) {
				this.addSelector(selector);
			}
		}

		this.scope = config.scope || null;
		this.onAddProperty = config.onAddProperty || this.onAddProperty;
		this.addProperties(config.properties || {});
		this.addPseudoClasses(config.pseudoClases || []);
	}

	public addProperties(properties: Record<string, string|number>): void {
		for (const property in properties) {
			this.addProperty(property, properties[property]);
		}
	}

	public addProperty(property: string, value: string | number): void {
		if (this.hasProperty(property)) {
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

		this.properties = {...this.properties, ...onAddPropertyHook(property, value)};
	}

	public addPseudoClasses(pseudoClasses: string[] | string): void {
		if (!Array.isArray(pseudoClasses)) {
			pseudoClasses = [pseudoClasses];
		}

		for (const pseudoClass of pseudoClasses) {
			if (!this.pseudoClasses.includes(pseudoClass)) {
				this.pseudoClasses.push(pseudoClass);
			}
		}
	}

	public addSelectors(selectors: Record<string, string | null>): void {
		for (const selector in selectors) {
			this.addSelector(selector, selectors[selector]);
		}
	}

	public addSelector(selector: string, pseudoClass: string = null): void {
		selector = selector.replace(/([^-_a-zA-Z\d])/g, '\\$1');

		if (pseudoClass) {
			selector += ':' + pseudoClass;
		}

		if (this.hasSelector(selector)) {
			return;
		}

		this.selectors.push(selector);
	}

	public getSelector(selector: string): string | null {
		return this.hasSelector(selector)
			? this.selectors[this.selectors.indexOf(selector)]
			: null;
	}

	public hasProperty(name: string): boolean {
		return name in this.properties;
	}

	public hasSelector(selector: string): boolean {
		return this.selectors.includes(selector);
	}

	public generateCss(config: Partial<CssRecordCompileParametersConfig> = {}): string {
		const minimize: boolean = 'minimize' in config ? config.minimize : false;
		const newLine = minimize ? '' : '\n';
		const scopePart = this.scope ? this.scope + ' ' : '';

		return this.selectors.map(selector => scopePart + '.' + selector).join(',' + newLine) + '{' + newLine
			+ Object.keys(this.properties)
				.map(property => `${(minimize ? '' : '\t') + property}:${this.properties[property]}`)
				.join(';' + newLine)
			+ newLine + '}' + newLine;
	}

	public serialize(): SerializedCssRecordInterface {
		const serializedObject: SerializedCssRecordInterface = {
			selectors: this.selectors.map(selector => {
				return selector.replace(/\\([^-_a-zA-Z\d])/g, '$1');
			}),
			properties: this.properties
		};

		if (this.onAddProperty) {
			serializedObject.onAddProperty = this.onAddProperty.toString();
		}

		if (this.scope) {
			serializedObject.scope = this.scope;
		}

		if (this.properties.length) {
			serializedObject.pseudoClasses = this.pseudoClasses;
		}

		return serializedObject;
	}

	public static deserialize(data: SerializedCssRecordInterface): CssRecord {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		const onAddPropertyFn = 'onAddProperty' in data ? new Function(data.onAddProperty) : null;
		return new CssRecord({
			...data,
			...{
				onAddProperty: onAddPropertyFn
			}
		});
	}

	public hydrate(data: Record<string, any>): void {
		for (const selector of data.selectors) {
			this.addSelector(selector);
		}

		this.addProperties(data.properties);

		if ('pseudoClasses' in data) {
			this.addPseudoClasses(data.pseudoClasses);
		}
	}

}

export { CssRecord };

export default CssRecord;
