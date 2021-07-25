import { Stylify, Profiler } from '@stylify/stylify';

/**
 * @param {Record<string, string|number|string[]|number[]>} processedObject
 * @returns {Record<string, string|number|string[]|number[]}
 */
const convertObjectFromStringableForm = (processedObject): Record<string, any> => {
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
	JSON.parse(decodeURIComponent('<%= encodeURIComponent(JSON.stringify(options)) %>'))
);

export default function (): void {
	const stylify = new Stylify({
		runtime: moduleConfig.runtime,
		compiler: moduleConfig.compiler
	});

	if (moduleConfig.importProfiler && !moduleConfig.compiler.mangleSelectors) {
		new Profiler(stylify).init();
	}
}
