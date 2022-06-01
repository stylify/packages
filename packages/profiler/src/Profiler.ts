import './profiler.scss';
import * as preact from 'preact';
import { initProfilerToolbar, ProfilerToolbarConfigInterface } from '.';

declare global {
	interface Window {
		title: string;
	}
}

export interface ProfilerConfigInterface {
	extensions?: any[],
	buttonPosition?: string
}

export type AddExtensionType = (extension: any) => void;

export type ConfigureType = (config: ProfilerToolbarConfigInterface) => void;

export { preact };

export class Profiler {

	public static readonly WINDOW_IS_DEFINED = typeof window !== 'undefined';

	// Dynamically added inside Toolbar.tsx
	public addExtension: AddExtensionType = null;

	public configure: ConfigureType = null;

	private config: ProfilerConfigInterface = {
		extensions: [],
		buttonPosition: null
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

		if (typeof globalThis.Stylify !== 'undefined') {
			globalThis.Stylify.Profiler = this;
		}

		const toolbarConfig = {
			extensions: this.config.extensions,
			buttonPosition: this.config.buttonPosition,
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
