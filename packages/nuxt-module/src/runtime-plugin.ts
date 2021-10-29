import { CompilationResult, Runtime } from '@stylify/stylify';
import type { CssRecord } from '@stylify/stylify';
import { Prefixer } from '@stylify/autoprefixer/esm/prefixer';
import { StylifyNuxtModuleConfigInterface } from '.';


const convertObjectFromStringableForm = (
	processedObject: string[]|number[]|Record<string, string|number|string[]|number[]>
): Record<string, string|number|string[]|number[]> => {
	const newObject = {};

	for (const key in processedObject) {
		const processedValue = processedObject[key];

		if (processedValue !== null && typeof processedValue === 'object') {
			newObject[key] = convertObjectFromStringableForm(processedValue);
		} else if (typeof processedValue === 'string' && processedValue.startsWith('FN__')) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			newObject[key] = new Function(`return ${processedValue.replace('FN__', '')}`)();
		} else {
			newObject[key] = processedValue;
		}
	}

	return newObject;
};

const moduleConfig = convertObjectFromStringableForm(
	JSON.parse(decodeURIComponent(`<%= encodeURIComponent(JSON.stringify(options)) %>`))
) as Partial<StylifyNuxtModuleConfigInterface>;

const prefixer = new Prefixer(moduleConfig.prefixesMap);

export default function (): void {
	moduleConfig.compiler.onPrepareCompilationResult = (compilationResult: CompilationResult): void => {
		compilationResult.onPrepareCssRecord = (cssRecord: CssRecord): void => {
			cssRecord.onAddProperty = (propertyName: string, propertyValue: string): Record<string, any> => {
				return prefixer.prefix(propertyName, propertyValue) as Record<string, any>;
			};
		};
	};

	globalThis.Stylify = new Runtime({
		dev: moduleConfig.dev,
		runtime: moduleConfig.runtime,
		compiler: moduleConfig.compiler
	});
}
