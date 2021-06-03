// @ts-nocheck

export default class SelectorProperties {

	public properties: Record<string, string> = {};

	public add(property: string, value: string): SelectorProperties {
		this.properties[property] = value;

		return this;
	}

	public addMultiple(properties: Record<string, any>): SelectorProperties {
		let property: string;
		// Object assign?
		for (property in properties) {
			this.add(property, properties[property]);
		}
		return this;
	}

}
