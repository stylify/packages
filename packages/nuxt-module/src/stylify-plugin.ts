import { Stylify } from '@stylify/stylify';
import { Prefixer } from '@stylify/autoprefixer';
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
			newObject[key] = new Function('return ' + processedValue.replace('FN__', ''))();
		} else {
			newObject[key] = processedValue;
		}
	}

	return newObject;
};

const moduleConfig = convertObjectFromStringableForm(
	JSON.parse(decodeURIComponent(`<%= encodeURIComponent(JSON.stringify(options)) %>`))
) as Partial<StylifyNuxtModuleConfigInterface>;

export default function (): void {
	const initStylify = () => {
		const stylify = new Stylify({
			runtime: moduleConfig.runtime,
			compiler: moduleConfig.compiler
		});

		new Prefixer(stylify.hooks, moduleConfig.prefixesMap);
		globalThis.Stylify = stylify;
		const event = new window.CustomEvent('stylify:ready', {detail: stylify});
		document.dispatchEvent(event);
	};

	if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
		initStylify();
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			initStylify();
		});
	}
}
