import { NuxtProfilerExtension } from './NuxtProfilerExtension';
import { Profiler } from '@stylify/profiler';

export default async (): Promise<void> => {
	const init = async () => {
		const data = await fetch('/stylify-stats');
		const jsonData = await data.text();
		const dataElement = document.createElement('script');
		dataElement.classList.add('stylify-profiler-data');
		dataElement.setAttribute('type', 'type="application/json"');
		dataElement.innerHTML = jsonData;
		document.querySelector('body').appendChild(dataElement);

		new Profiler({
			extensions: [NuxtProfilerExtension]
		});
	};

	if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
		await init();

	} else {
		await init();
	}
};
