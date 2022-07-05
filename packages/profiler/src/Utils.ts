import type { Runtime } from '@stylify/stylify';

class Utils {

	private readonly PRISM_VERSION = '1.23.0';

	private readonly PRISM_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/prism/${this.PRISM_VERSION}`;

	private stylify: Runtime = null;

	private profilerDataFromPage: Record<string, Record<string, any>> = null;

	constructor() {
		document.addEventListener('stylify:ready', (event: any): void => {
			this.stylify = event.detail;
		});
	}

	public getProfilerDataFromPage(extensionName: string): Record<string, any>|null {
		if (!this.profilerDataFromPage) {
			document.querySelectorAll('script.stylify-profiler-data').forEach((element) => {
				try {
					this.profilerDataFromPage = {...this.profilerDataFromPage, ...JSON.parse(element.innerHTML)};
				// eslint-disable-next-line no-empty
				} catch (e) {
				}
			});
		}

		return this.profilerDataFromPage && this.profilerDataFromPage[extensionName]
			? this.profilerDataFromPage[extensionName]
			: null;
	}

	public getStylifyRuntime(): Runtime|null {
		let stylify = this.stylify;

		if (!stylify) {
			stylify = globalThis.Stylify;
		}

		return stylify || null;
	}

	public convertSizeToKb(size: number, precision = 1): string {
		return `${(size / 1000).toFixed(precision)} Kb`;
	}

	public convertTimeToSeconds(time: number, precision = 1): string {
		return time.toFixed(precision) + ' ms';
	}

	public openCodeInNewWindow = (code: string, language: string = null, windowTitle: string = null): void => {
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
	};

}

export const utils = new Utils;
