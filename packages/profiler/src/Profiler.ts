import './profiler.scss';
import {
	BuildsAnalyzerExtension,
	CacheInfoExtension,
	ConfigurationsVisualizerExtension,
	DomNodesCounterExtension
} from './Extensions';
import { addProfilerExtension, initProfilerToolbar } from './Toolbar';
import type { Runtime } from '@stylify/stylify';

declare global {
    interface Window {
        title: string;
		Stylify: Runtime
    }
}

export interface ProfilerExtensionPropsInterface {
	config: {
		stylify: Runtime,
		openCodeInNewWindow: CallableFunction
	}
}

export class Profiler {

	private readonly PRISM_VERSION = '1.23.0';

	private readonly PRISM_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/prism/${this.PRISM_VERSION}`;

	public static readonly windowIsDefined = typeof window !== 'undefined';

	constructor() {
		this.init();
	}

	public init(): void {
		this.addProfilerExtension(BuildsAnalyzerExtension);
		this.addProfilerExtension(CacheInfoExtension);
		this.addProfilerExtension(ConfigurationsVisualizerExtension);
		this.addProfilerExtension(DomNodesCounterExtension);

		if (!Profiler.windowIsDefined) {
			return null;
		}

		document.addEventListener('stylify:ready', (event: any) => {
			initProfilerToolbar({
				stylify: event.detail,
				openCodeInNewWindow: this.openCodeInNewWindow
			});
		});
	}

	public addProfilerExtension(profilerExtension: any): void {
		addProfilerExtension(profilerExtension);
	}

	private openCodeInNewWindow = (code: string, language: string = null, windowTitle: string = null) => {
		const codeWindow = window.open('');
		language = language || 'markup';
		codeWindow.title = 'Stylify: ' + (windowTitle || 'profiler preview');
		if (language === 'markup') {
			code = code.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}

		codeWindow.document.write(`
			<link href="${this.PRISM_CDN_URL}/themes/prism.min.css" rel="stylesheet" />
			<script async defer src="${this.PRISM_CDN_URL}/components/prism-core.min.js"></script>
			<script async defer src="${this.PRISM_CDN_URL}/plugins/autoloader/prism-autoloader.min.js"></script>
			<pre><code class="language-${language}">${code}</code></pre>
		`);
		codeWindow.document.close();
	}

}
