import { NuxtProfilerExtension } from './NuxtProfilerExtension';
import { Profiler } from '@stylify/profiler';

export default function (): void {
	new Profiler({
		extensions: [NuxtProfilerExtension]
	});
}
