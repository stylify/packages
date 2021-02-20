import { Stylify, Profiler, nativeConfig } from '@stylify/stylify/esm';

export default function (ctx) {
	const stylify = new Stylify({
		compiler: nativeConfig
	});

	(new Profiler(stylify)).init();
}
