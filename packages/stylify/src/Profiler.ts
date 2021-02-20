import * as preact from 'preact';
import htm from 'htm';
import {
	addProfilerExtension,
	initProfilerToolbar,
	BuildsAnalyzerExtension,
	ConfigurationsVisualizerExtension,
	DomNodesCounterExtension
} from './Profiler/index';

const isWindowDefined = typeof window !== 'undefined';

class Profiler {

	private readonly windowIsDefined = isWindowDefined;

	private readonly preact = preact;

	private readonly htm = htm;

	constructor() {
		addProfilerExtension(BuildsAnalyzerExtension);
		addProfilerExtension(ConfigurationsVisualizerExtension);
		addProfilerExtension(DomNodesCounterExtension);
	}

	public initToolbar(): Profiler {
		(<any>window).Stylify.configure({
			compiler: {
				dev: true,
				pregenerate: `
					border-top:1px__solid__#444
					bottom:0
					color:#fff
					content-visibility:hidden
					content-visibility:visible
					display:block
					display:none
					font-family:arial
					font-size:12px
					line-height:26px
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
						height:26px
						padding:0__8px
						display:flex
						align-items:center
						justify-content:center
						font-size:14px
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
					'profiler-extension__button-icon': 'margin-right:8px display:inline-block font-weight:bold color:#aaa',
					'profiler-extension__button-label': 'line-height:1'

				}
			}
		});

		initProfilerToolbar();
		return this;
	}

}

const profiler = new Profiler();

const initProfiler = (): boolean => {
	let inicialized = false;

	if ((<any>window).Stylify !== 'undefined') {
		//(<any>window).Stylify.Profiler = profiler;
		profiler.initToolbar();
		inicialized = true;
	}

	return inicialized;
}

if (isWindowDefined) {
	if (!initProfiler()) {
		document.addEventListener('DOMContentLoaded', () => {
			initProfiler();
		});
	}
}
