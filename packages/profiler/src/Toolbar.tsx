/*
	@stylify-components[{
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
	}]
	@stylify-pregenerate[
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
		profiler-extension
		profiler-extension__button
		profiler-extension__button--active
		profiler-extension__dropdown
		profiler-extension__link
		profiler-extension__button-icon
		profiler-extension__button-label
	]
*/
import { Component, render } from 'preact';
import type { Runtime } from '@stylify/stylify';

export interface ToolbarInitConfig {
	stylify: Runtime
	openCodeInNewWindow: CallableFunction
}

const extensions = {};
let extensionsConfig = {};

const ToolbarExtension = ({ extensionName }) => {
	const TagName = extensions[extensionName];
	return <TagName config={extensionsConfig} />;
};

const initProfilerToolbar = (profilerConfig: ToolbarInitConfig): void => {
	extensionsConfig = profilerConfig;

	let profilerToolbarElement = document.querySelector(`#${ProfilerToolbar.TOOLBAR_ELEMENT_ID}`);

	if (!profilerToolbarElement) {
		profilerToolbarElement = document.createElement('div');
		profilerToolbarElement.id = ProfilerToolbar.TOOLBAR_ELEMENT_ID;
		profilerToolbarElement.classList.add('stylify-ignore');

		document.body.append(profilerToolbarElement);
	}

	render(<ProfilerToolbar config={extensionsConfig} />, profilerToolbarElement, profilerToolbarElement);
};

const addProfilerExtension = (component: any): void => {
	extensions[component.name] = component;
};

class ProfilerToolbar extends Component<any> {

	public static readonly TOOLBAR_ELEMENT_ID = 'stylify-profiler';

	private readonly LOCAL_STORAGE_ID = 'stylify-profiler;'

	public state: Record<string, any> = {
		extensions: extensions,
		extensionsVisible: true
	}

	public constructor() {
		super();

		const configFromLocalStorage = this.getConfigFromLocalStorage();

		if (configFromLocalStorage) {
			this.state.extensionsVisible = configFromLocalStorage.extensionsVisible;
		}
	}

	private getConfigFromLocalStorage = (): Record<string, any> | null => {
		const localStorageConfig = localStorage.getItem(this.LOCAL_STORAGE_ID);

		if (!localStorageConfig) {
			localStorage.setItem(this.LOCAL_STORAGE_ID, JSON.stringify({
				extensionsVisible: this.state.extensionsVisible
			}));
		}

		return localStorageConfig ? JSON.parse(localStorageConfig) as Record<string, any> : null;
	}

	private updateConfigInLocalStorage = (config: Record<string, any> = {}): void => {
		localStorage.setItem(
			this.LOCAL_STORAGE_ID, JSON.stringify(Object.assign(this.getConfigFromLocalStorage(), config))
		);
	}

	private toggleExtensionsVisibility = () => {
		const extensionsVisible = !this.state.extensionsVisible;
		this.setState({
			extensionsVisible: extensionsVisible
		});
		this.updateConfigInLocalStorage({
			extensionsVisible: extensionsVisible
		});
	}

	/* eslint-disable max-len */
	public render() {
		return (
			<div id={ProfilerToolbar.TOOLBAR_ELEMENT_ID} class="stylify-ignore">
				<div class="opacity:0.1 hover:opacity:1 transition:opacity__0.3s will-change:opacity align-items:center white-space:nowrap position:fixed bottom:0 left:0 background:#000 color:#fff width:auto font-family:arial font-size:12px display:flex line-height:1">
					<a role="button" class="font-size:12px line-height:20px padding:0__8px align-items:center display:inline-block cursor:pointer user-select:none" onClick={this.toggleExtensionsVisibility}>
						<strong>Stylify</strong>
					</a>
					<div class={`align-items:center ${this.state.extensionsVisible ? 'display:flex' : 'display:none'} ${this.state.extensionsVisible ? 'content-visibility:visible' : 'content-visibility:hidden'}`}>
						{Object.keys(this.state.extensions).map((extensionName) => {
							return <ToolbarExtension extensionName={extensionName} />;
						})}
					</div>
				</div>
			</div>
		);
	}
	/* eslint-enable max-len */
}

export {
	addProfilerExtension,
	initProfilerToolbar
};
