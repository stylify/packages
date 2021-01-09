export default class SelectorProperties {

	public properties: Record<string, any> = {};

	public add(property: string, value: any): SelectorProperties {
		this.properties[property] = value;
		return this;
	}

	public addMultiple(properties: Record<string, any>) {
		let property: string;
		// Object assign?
		for (property in properties) {
			this.add(property, properties[property]);
		}
		return this;
	}

}
