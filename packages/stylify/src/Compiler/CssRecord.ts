export default class CssRecord {

	private selectors: string[] = [];

	private properties: Record<string, any> = [];

	constructor(selector: string = null, properties: Record<string, any> = {}) {
		this.selectors = [];
		this.properties = properties;

		if (selector) {
			this.addSelector(selector);
		}
	}

	getProperties() {
		return this.properties;
	}

	addProperty(property, value) {
		if (!this.hasProperty(property)) {
			this.properties[property] = value;
		}
	}

	addSelector(selector, pseudoClass = null) {
		selector = selector[0] + selector.substr(1).replace(/([^-_a-zA-Z\d])/g, '\\$1');

		if (pseudoClass) {
			selector += ':' + pseudoClass;
		}

		if (!this.hasSelector(selector)) {
			this.selectors.push(selector);
		}
	}

	getProperty(name) {
		if (this.hasProperty(name)) {
			return this.getProperties()[name];
		}
	}

	getSelector(selector) {
		return this.hasSelector(selector) ? this.selectors[this.selectors.indexOf(selector)] : null;
	}

	hasProperty(name) {
		return typeof this.getProperties()[name] !== 'undefined';
	}

	hasSelector(selector) {
		return this.selectors.indexOf(selector) > -1;
	}

	compile() {
		let css = this.selectors.join(',') + '{';
		let lastItemIndex = this.properties.length - 1;

		Object.keys(this.properties).forEach((property, index) => {
			css += property + ':' + this.properties[property];

			if (index !== lastItemIndex) {
				css += ';'
			}
		});

		css += '}';

		return css;
	}
}
