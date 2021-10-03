import './icons/style.css';
import { render, Component } from 'preact';

const extensions = {};
let extensionsConfig = {};

const ToolbarExtension = ({ extensionName }) => {
	const TagName = extensions[extensionName];
	return <TagName config={extensionsConfig} />;
};

class ProfilerToolbar extends Component<any> {

	private LOCAL_STORAGE_ID = 'stylify-profiler;'

	public state: Record<string, any> = {
		profilerVisible: false,
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

		return localStorageConfig ? JSON.parse(localStorageConfig) : null;
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

	public componentDidMount = () => {
		this.props.config.stylify.hooks.addHook('stylify:runtime:uncloak', ({data}) => {
			const elementId = data.id || null;

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
				class="align-items:center white-space:nowrap position:fixed bottom:0 left:0 background:#000 color:#fff width:auto font-family:arial font-size:12px display:flex line-height:1"
			>
				<a role="button" class="font-size:12px line-height:20px padding:0__8px align-items:center display:inline-block cursor:pointer user-select:none" onClick={this.toggleExtensionsVisibility}>
					<strong>Stylify</strong>
				</a>
				<div class={`align-items:center display:${this.state.extensionsVisible ? 'flex' : 'none'} content-visibility:${this.state.extensionsVisible ? 'visible' : 'hidden'}`}>
					{Object.keys(this.state.extensions).map((extensionName) => {
						return <ToolbarExtension extensionName={extensionName} />;
					})}
				</div>
			</div>
		);
	}
}

const initProfilerToolbar = (profilerConfig): void => {
	extensionsConfig = profilerConfig;

	let profilerToolbarElement = document.querySelector('#stylify-profiler');

	if (!profilerToolbarElement) {
		profilerToolbarElement = document.createElement('div');
		profilerToolbarElement.id = 'stylify-profiler';
		document.body.appendChild(profilerToolbarElement);
	}

	render(<ProfilerToolbar config={extensionsConfig} />, profilerToolbarElement, profilerToolbarElement);
};

const addProfilerExtension = (component: any) => {
	extensions[component.name] = component;
};

export {
	addProfilerExtension,
	initProfilerToolbar
};
