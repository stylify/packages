import { Stylify, Profiler } from '@stylify/stylify/esm';

const convertObjectFromStringableForm = (processedObject) => {
	const newObject = {}

	for (const key in processedObject) {
		const processedValue = processedObject[key];

		if (processedValue !== null && typeof processedValue === 'object') {
			newObject[key] = convertObjectFromStringableForm(processedValue);
		} else if (typeof processedValue === 'string' && processedValue.startsWith('FN__')) {
			newObject[key] = (new Function('return ' + processedValue.replace('FN__', '')))();
		} else {
			newObject[key] = processedValue;
		}
	}

	return newObject;
};

const moduleConfig = convertObjectFromStringableForm(
	JSON.parse(decodeURIComponent('<%= encodeURIComponent(JSON.stringify(options)) %>'))
);

export default function (ctx) {
	const stylify = new Stylify({
		runtime: moduleConfig.runtime,
		compiler: moduleConfig.compiler
	});

	if (moduleConfig.importProfiler && !moduleConfig.compiler.mangleSelectors) {
		(new Profiler(stylify)).init();
	}
}
