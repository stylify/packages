import Profiler from '.';

const isWindowDefined = typeof window !== 'undefined';

if (isWindowDefined) {
	const profiler = new Profiler();
	if (!profiler.init()) {
		document.addEventListener('DOMContentLoaded', () => {
			profiler.init();
		});
	}
}
