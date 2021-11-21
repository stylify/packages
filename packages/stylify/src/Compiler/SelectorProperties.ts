export class SelectorProperties {

	public properties: Record<string, string> = {};

	public add(property: string, value: string|number): void {
		this.properties[property] = String(value);
	}

	public addMultiple(properties: Record<string, any>): void {
		this.properties = {...this.properties, ...properties};
	}

}
