import { PrefixesMapRecordType } from '.';

class Prefixer {

	public prefixesMap: PrefixesMapRecordType = {};

	constructor(prefixesMap: PrefixesMapRecordType = {}) {
		this.setPrefixesMap(prefixesMap);
	}

	public prefix(propertyName: string, propertyValue: string): Record<string, any>|null {
		if (propertyName in this.prefixesMap && propertyValue in this.prefixesMap[propertyName]) {
			return this.prefixesMap[propertyName][propertyValue];
		}

		return null;
	}

	public setPrefixesMap(prefixesMap: PrefixesMapRecordType = {}): void {
		this.prefixesMap = prefixesMap;
	}

	public addPrefixes(prefixesMap: PrefixesMapRecordType = {}): void {
		this.prefixesMap = {...this.prefixesMap, ...prefixesMap};
	}

}

export { Prefixer };
