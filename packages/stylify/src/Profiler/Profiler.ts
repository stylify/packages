import * as preact from 'preact';
import htm from 'htm';
import { addProfilerExtension, initProfilerToolbar } from './Toolbar';
import {
	BuildsAnalyzerExtension,
	ConfigurationsVisualizerExtension,
	DomNodesCounterExtension,
	CacheInfoExtension
} from './Extensions';
import { Stylify } from '..';

declare global {
    interface Window {
        title: string;
		Stylify: Stylify
    }
}

class Profiler {

	private readonly PRISM_VERSION = '1.23.0';

	private readonly PRISM_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/prism/' + this.PRISM_VERSION;

	private readonly preact = preact;

	private readonly htm = htm;

	private stylify = null;


	constructor(stylify = null) {
		this.stylify = stylify || window.Stylify;
	}

	public init(stylify = null): boolean {
		this.stylify = stylify || this.stylify;

		if (stylify && typeof stylify === 'undefined') {
			console.error('Stylify profiller could not be initialized: Stylify is not defined.');
			return false;
		}

		this.stylify.Profiler = Profiler;

		this.stylify.configure({
			compiler: {
				dev: true,
				pregenerate: `
					border-top:1px__solid__#444
					background-color:#333
					bottom:0
					color:#fff
					content-visibility:hidden
					content-visibility:visible
					display:block
					display:none
					font-family:arial
					font-size:12px
					line-height:20px
					margin-left:8px
					margin:0__8px
					max-width:800px
					overflow-x:auto
					padding-top:8px
					position:fixed
					text-align:left
					visibility:hidden
					visibility:visible
					width:auto
					word-spacing:24px
				`,
				components: {
					'profiler-extension': `
						box-sizing:border-box
						border-left:1px__solid__#555
						align-items:center
						display:flex
						min-height:100%
						position:relative
						hover:background:#333
					`,
					'profiler-extension__button': `
						box-sizing:border-box
						height:20px
						padding:0__8px
						display:flex
						align-items:center
						justify-content:center
						font-size:12px
						cursor:pointer
						user-select:none
					`,
					'profiler-extension__button--active': 'background-color:#333',
					'profiler-extension__dropdown': `
						box-sizing:border-box
						position:absolute
						bottom:100%
						left:0
						max-height:50vh
						overflow:auto
						min-width:100%
						background:#000
						padding:8px
					`,
					'profiler-extension__link': `
						box-sizing:border-box
						text-decoration:none
						color:#00b2e5
						margin-right:8px
						white-space:nowrap
						display:inline-block
						cursor:pointer
					`,
					'profiler-extension__button-icon': `
						width:12px
						height:12px
						margin-right:8px
						display:inline-block
						font-weight:bold
						color:#aaa
					`,
					'profiler-extension__button-label': 'line-height:1'
				}
			}
		});

		addProfilerExtension(BuildsAnalyzerExtension);
		addProfilerExtension(CacheInfoExtension);
		addProfilerExtension(ConfigurationsVisualizerExtension);
		addProfilerExtension(DomNodesCounterExtension);

		initProfilerToolbar({
			stylify: this.stylify,
			openCodeInNewWindow: this.openCodeInNewWindow
		});

		return true;
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

export { Profiler };

export default Profiler;
