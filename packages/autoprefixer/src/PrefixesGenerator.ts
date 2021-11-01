import { CompilationResult } from '@stylify/stylify';
import autoprefixer from 'autoprefixer';
import postcssJs from 'postcss-js';

const prefixer = postcssJs.sync([autoprefixer()]);


export type PrefixesMapRecordType = Record<string, Record<string|number, []>>;

class PrefixesGenerator {

	public createPrefixesMap(compilationResult: CompilationResult): PrefixesMapRecordType {
		const prefixesMap = {};

		for (const selector in compilationResult.selectorsList) {
			const cssRecord = compilationResult.selectorsList[selector];

			for (const property in cssRecord.properties) {
				const propertyAndValueToProcess = {};
				const propertyValue = cssRecord.properties[property];
				propertyAndValueToProcess[property] = propertyValue;
				const prefixed = this.prefix(propertyAndValueToProcess);

				if (Object.keys(prefixed).length === 1) {
					continue;
				}

				if (!(property in prefixesMap)) {
					prefixesMap[property] = {};
				}

				const value = cssRecord.properties[property];

				if (!(value in prefixesMap[property])) {
					prefixesMap[property][value] = [];
				}

				const prefixedInDashCase = {};
				Object.keys(prefixed).forEach((key: string): void => {
					const dashCasedkey = key.replace(/^ms/, 'Ms').replace(/[A-Z]/g, '-$&').toLowerCase();
					prefixedInDashCase[dashCasedkey] = prefixed[key];
				});

				prefixesMap[property][propertyValue] = prefixedInDashCase;
			}
		}

		return prefixesMap;
	}

	private prefix(propertiesAndValuesToProcess: Record<string, string|number>): Record<string, string|number> {
		return prefixer(propertiesAndValuesToProcess) as Record<string, string|number>;
	}

}

export { PrefixesGenerator };
