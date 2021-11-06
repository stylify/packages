import './profiler.scss';
import * as preact from 'preact';
import { initProfilerToolbar } from '.';

declare global {
	interface Window {
		title: string;
	}
}

export interface ProfilerConfigInterface {
	extensions?: any[]
}

export type AddExtensionType = (extension: any) => void;

export { preact };

export class Profiler {

	public static readonly WINDOW_IS_DEFINED = typeof window !== 'undefined';

	// Dynamically added inside Toolbar.tsx
	public addExtension: AddExtensionType = null;

	private config: ProfilerConfigInterface = {
		extensions: []
	};

	constructor(config: ProfilerConfigInterface = {}) {
		this.config = {
			...this.config,
			...config
		};

		this.init();
	}

	public init(): void {
		if (!Profiler.WINDOW_IS_DEFINED) {
			return null;
		}

		const toolbarConfig = {
			extensions: this.config.extensions,
			profiler: this
		};

		if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
			initProfilerToolbar(toolbarConfig);
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				initProfilerToolbar(toolbarConfig);
			});
		}
	}

}
