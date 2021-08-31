import { HooksManager } from '@stylify/stylify';
import { PrefixesMapRecordType } from '.';

class Prefixer {

	constructor(hooksManager: typeof HooksManager, prefixesMap: Partial<PrefixesMapRecordType> = {}) {
		hooksManager.addHook('stylify:cssRecord:addProperty', (hookData) => {
			const propertyName = Object.keys(hookData.data)[0];
			if (!(propertyName in prefixesMap)) {
				return;
			}

			hookData.data = prefixesMap[propertyName][hookData.data[propertyName]] || hookData.data;
		});
	}

}

export { Prefixer };

export default Prefixer;
