import { render, Component } from 'preact';
import htm from 'htm';
import EventsEmitter from '../EventsEmitter';

const extensions = {};

const ToolbarExtension = ({ extensionName }) => {
	const TagName = extensions[extensionName];
	return <TagName />;
}

class ProfilerToolbar extends Component {
	private state: Record<string, any> = {
		profilerVisible: false,
		extensions: extensions,
		extensionsVisible: true
	}

	private toggleExtensionsVisibility = () => {
		this.setState({
			extensionsVisible: !this.state.extensionsVisible
		});
	}

	private componentDidMount = () => {
		EventsEmitter.addListener('stylify:uncloak', (event) => {
			const elementId = event.detail.id || null;

			if (elementId !== 'stylify-profiler') {
				return;
			}

			this.setState({
				profilerVisible: true
			});
		});
	}

	public render() {
		return (
			<div
				s-cloak="stylify-profiler"
				hidden={this.state.profilerVisible === false}
				id="stylify-profiler"
				class="position:fixed bottom:0 left:0 background:#000 color:#fff width:auto font-family:arial font-size:14px display:flex"
			>
				<a role="button" class="padding:8px align-items:center display:inline-block cursor:pointer user-select:none" onClick={this.toggleExtensionsVisibility}>
					<strong>Stylify</strong>
				</a>
				<div class={`align-items:center display:${this.state.extensionsVisible ? 'flex' : 'none'}`}>
					{Object.keys(this.state.extensions).map((extensionName, i) => {
						return <ToolbarExtension extensionName={extensionName} />;
					})}
				</div>
			</div>
		);
	}
}

const initProfilerToolbar = (): void => {
	let profilerToolbarElement = document.querySelector('#stylify-profiler');

	if (!profilerToolbarElement) {
		profilerToolbarElement = document.createElement('div');
		profilerToolbarElement.id = 'stylify-profiler';
		document.body.appendChild(profilerToolbarElement);
	}

	render(<ProfilerToolbar />, profilerToolbarElement, profilerToolbarElement);
};

const addProfilerExtension = (component: Component) => {
	extensions[component.name] = component;
}

export {
	addProfilerExtension,
	initProfilerToolbar,
};
