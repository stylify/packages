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

export default class Profiler {

	private readonly windowIsDefined = isWindowDefined;

	private readonly preact = preact;

	private readonly htm = htm;

	constructor(config: Record<string, any> = {}) {
		addProfilerExtension(BuildsAnalyzerExtension);
		addProfilerExtension(ConfigurationsVisualizerExtension);
		addProfilerExtension(DomNodesCounterExtension);
	}

	public initToolbar(): Profiler {
		(<any>window).Stylify.configure({
			compiler: {
				components: {
					'profiler-extension': `
						border-left:1px__solid__#555
						align-items:center
						display:flex
						min-height:100%
						hover:background:#333
						position:relative
					`,
					'profiler-extension__button': 'padding:8px display:inline-block cursor:pointer user-select:none',
					'profiler-extension__dropdown': `
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
						text-decoration:none
						color:#00b2e5
						margin-right:8px
						white-space:nowrap
						display:inline-block
						cursor:pointer
					`,
					'profiler-extension__button-icon': 'margin-right:8px'
				}
			}
		});

		initProfilerToolbar();
		return this;
	}

}

const profiler = new Profiler();

if (isWindowDefined) {
	document.addEventListener('DOMContentLoaded', () => {
		if ((<any>window).Stylify !== 'undefined') {
			(<any>window).Stylify.Profiler = profiler;
			profiler.initToolbar();
		}
	})
}

