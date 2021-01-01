export default class SelectorProperties {

	private properties: Record<string, any> = {};

	public add(property: string, value: any): SelectorProperties {
		this.properties[property] = value;
		return this;
	}

	public addMultiple(properties: Record<string, any>) {
		let property: string;
		for (property in properties) {
			this.add(property, properties[property]);
		}
		return this;
	}

	public getProperties(): Record<string, any> {
		return this.properties;
	}

}
