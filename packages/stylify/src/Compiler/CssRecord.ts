import HooksManager from '../HooksManager';

export interface SerializedCssRecordInterface {
	selectors: string[],
	properties: Record<string, string | number>,
	pseudoClasses: string[]
}

export interface CssRecordCompileParametersConfig {
	minimize: boolean
}

class CssRecord {

	public selectors: string[] = [];

	public properties: Record<string, string | number> = {};

	public pseudoClasses: string[] = [];

	constructor(
		selectors: string|string[] = [],
		properties: Record<string, string | number> = {},
		pseudoClases: string[] = []
	) {
		selectors = Array.isArray(selectors) ? selectors : [selectors];

		for (const selector of selectors) {
			this.addSelector(selector);
		}

		this.addProperties(properties);
		this.addPseudoClasses(pseudoClases);
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

		const propertiesToAdd = {};
		propertiesToAdd[property] = value;
		const { data } = HooksManager.callHook('stylify:cssRecord:addProperty', propertiesToAdd);
		this.properties = {...this.properties, ...data};
	}

	public addPseudoClasses(pseudoClasses: string[] | string): void {
		if (!Array.isArray(pseudoClasses)) {
			pseudoClasses = [pseudoClasses];
		}

		const { data } = HooksManager.callHook('stylify:cssRecord:addPseudoClasses', pseudoClasses);
		for (const pseudoClass of data) {
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

		const { data } = HooksManager.callHook('stylify:cssRecord:addSelector', selector);
		this.selectors.push(data);
	}

	public getSelector(selector: string): string | null {
		return this.hasSelector(selector) ? this.selectors[this.selectors.indexOf(selector)] : null;
	}

	public hasProperty(name: string): boolean {
		return name in this.properties;
	}

	public hasSelector(selector: string): boolean {
		return this.selectors.indexOf(selector) > -1;
	}

	public compile(config: Partial<CssRecordCompileParametersConfig> = {}): string {
		const minimize: boolean = 'minimize' in config ? config.minimize : false;
		const newLine = minimize ? '' : '\n';

		return this.selectors.map(selector => '.' + selector).join(',' + newLine) + '{' + newLine
			+ Object.keys(this.properties)
				.map(property => `${(minimize ? '' : '\t') + property}:${this.properties[property]}`)
				.join(';' + newLine)
			+ newLine + '}' + newLine;
	}

	public serialize(): SerializedCssRecordInterface {
		const serializedObject = {
			selectors: this.selectors.map(selector => {
				return selector.replace(/\\([^-_a-zA-Z\d])/g, '$1');
			}),
			properties: this.properties,
			pseudoClasses: []
		};

		if (this.properties.length) {
			serializedObject.pseudoClasses = this.pseudoClasses;
		}

		return serializedObject;
	}

	public static deserialize(data: Record<string, any>): CssRecord {
		return new CssRecord(data.selectors, data.properties, data.pseudoClasses);
	}

	public hydrate(data: Record<string, any>): void {
		for (const selector of data.selectors) {
			this.addSelector(selector);
		}

		if (data.pseudoClasses.length) {
			this.addPseudoClasses(data.pseudoClasses);
		}

		this.addProperties(data.properties);
	}

}

export { CssRecord };

export default CssRecord;
