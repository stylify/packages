export class SelectorProperties {

	public properties: Record<string, string> = {};

	public add(property: string, value: string|number): void {
		this.properties[property] = String(value);
	}

	public addMultiple(properties: Record<string, string|number>): void {
		for (const propertyName in properties) {
			this.add(propertyName, properties[propertyName]);
		}
	}

}
