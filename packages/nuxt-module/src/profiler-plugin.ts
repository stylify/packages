import Profiler from '@stylify/profiler';

export default function (): void {

	document.addEventListener('stylify:ready', (e: CustomEvent) => {
		new Profiler(e.detail).init();
	});

}
