import type { hooksManager as stylifyHooksManager } from '@stylify/stylify';
import { PrefixesMapRecordType } from '.';

class Prefixer {

	private prefixesMap: Partial<PrefixesMapRecordType> = {};

	constructor(hooksManager: typeof stylifyHooksManager, prefixesMap: Partial<PrefixesMapRecordType> = {}) {
		this.setPrefixesMap(prefixesMap);
		hooksManager.addHook('stylify:cssRecord:addProperty', (hookData) => {
			const propertyName = Object.keys(hookData.data)[0];
			if (!(propertyName in this.prefixesMap)) {
				return;
			}

			hookData.data = this.prefixesMap[propertyName][hookData.data[propertyName]] || hookData.data;
		});
	}

	public setPrefixesMap(prefixesMap: Partial<PrefixesMapRecordType> = {}): void {
		this.prefixesMap = prefixesMap;
	}

	public addPrefixes(prefixesMap: Partial<PrefixesMapRecordType> = {}): void {
		this.prefixesMap = {...this.prefixesMap, ...prefixesMap};
	}

}

export { Prefixer };

export default Prefixer;
