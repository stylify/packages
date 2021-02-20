export default class CssRecord {

	private selectors: string[] = [];

	private properties: Record<string, any> = [];

	public pseudoClasses: string[] = [];

	constructor(selector: string = null, properties: Record<string, any> = {}) {
		this.properties = properties;

		if (selector) {
			this.addSelector(selector);
		}
	}

	public addProperty(property, value) {
		if (!this.hasProperty(property)) {
			this.properties[property] = value;
		}
	}

	public addSelector(selector, pseudoClass = null) {
		selector = selector[0] + selector.substr(1).replace(/([^-_a-zA-Z\d])/g, '\\$1');

		if (pseudoClass) {
			selector += ':' + pseudoClass;
		}

		if (!this.hasSelector(selector)) {
			this.selectors.push(selector);
		}
	}

	public getSelector(selector) {
		return this.hasSelector(selector) ? this.selectors[this.selectors.indexOf(selector)] : null;
	}

	public hasProperty(name) {
		return typeof this.properties[name] !== 'undefined';
	}

	public hasSelector(selector) {
		return this.selectors.indexOf(selector) > -1;
	}

	public compile(config: Record<string, any> = {}) {
		let minimize: Boolean = config.minimize || false;
		const newLine = minimize ? '' : '\n';

		return this.selectors.map(selector => '.' + selector).join(',' + newLine) + '{' + newLine
			+ Object.keys(this.properties)
				.map(property => (minimize ? '' : '\t') + property + ':' + this.properties[property])
				.join(';' + newLine)
			+ newLine + '}' + newLine;
	}

}
