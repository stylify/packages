import { CompilerExtension, RuntimeExtension, SummaryExtension } from './Extensions';
import { Profiler, preact } from '.';

const { h } = preact;

export interface ProfilerExtensionPropsInterface {
	toggleTab: (extensionName: string) => void
}

export interface ProfilerExtensionInterface {
	title: string,
	icon?: string
}

export interface ProfilerToolbarConfigInterface {
	extensions: any[],
	buttonPosition: string,
	profiler: Profiler
}

type ExpandableState = {
	profilerVisible: boolean,
	profilerNavigationVisible: boolean,
	selectedTab: string|null,
	extensions: Record<string, any>,
	buttonPosition: string
};

class ProfilerToolbar extends preact.Component<any, ExpandableState> {

	public static readonly TOOLBAR_ELEMENT_ID = 'stylify-profiler';

	private readonly LOCAL_STORAGE_ID = 'stylify-profiler';

	private extensionsConfig: ProfilerExtensionPropsInterface = null;

	public constructor({ config }) {
		super();

		config.profiler.addExtension = (extension: string) => {
			this.addExtension(extension, true);
		};

		config.profiler.configure = (config: ProfilerToolbarConfigInterface) => {
			this.configure(config);
		};

		const configFromLocalStorage = this.getConfigFromLocalStorage();

		this.state = {
			...{
				extensions: {},
				profilerVisible: false,
				profilerNavigationVisible: false,
				selectedTab: null,
				buttonPosition: config.buttonPosition || 'bottom:0; left:0'
			},
			...configFromLocalStorage ? configFromLocalStorage : {}
		};

		this.addExtension(SummaryExtension);
		this.addExtension(CompilerExtension);
		this.addExtension(RuntimeExtension);

		for (const extension of config.extensions) {
			this.addExtension(extension);
		}

		this.extensionsConfig = {
			toggleTab: (extensionName: string) => {
				return this.toggleTabVisibility(`${extensionName}`);
			}
		};
	}

	public configure(config: ProfilerToolbarConfigInterface): void {
		if ('extensions' in config) {
			for (const extension of config.extensions) {
				this.addExtension(extension);
			}
		}

		if ('buttonPosition' in config) {
			this.setState({
				buttonPosition: config.buttonPosition
			});
		}
	}

	public addExtension(component: any, updateState = false): void {
		const extensionName = component.name.toLowerCase();

		if (updateState) {
			const extensions = this.state.extensions;
			extensions[extensionName] = component;
			this.setState({
				extensions: extensions
			});
		} else {
			this.state.extensions[extensionName] = component;
		}
	}

	private getConfigFromLocalStorage = (): Record<string, any> | null => {
		const localStorageConfig = localStorage.getItem(this.LOCAL_STORAGE_ID);

		if (!localStorageConfig) {
			localStorage.setItem(this.LOCAL_STORAGE_ID, JSON.stringify({
				profilerVisible: false,
				selectedTab: null
			}));
		}

		return localStorageConfig ? JSON.parse(localStorageConfig) as Record<string, any> : null;
	}

	private updateConfigInLocalStorage = (config: Record<string, any> = {}): void => {
		localStorage.setItem(this.LOCAL_STORAGE_ID, JSON.stringify({...this.getConfigFromLocalStorage(), ...config}));
	}

	private toggleProfilerVisibility = () => {
		const profilerVisible = !this.state.profilerVisible;

		this.setState({
			profilerVisible: profilerVisible
		});

		this.updateConfigInLocalStorage({
			profilerVisible: profilerVisible
		});
	}

	private toggleProfilerNavigationVisibility = () => {
		const profilerNavigationVisible = !this.state.profilerNavigationVisible;
		this.setState({
			profilerNavigationVisible: profilerNavigationVisible
		});
	}

	private toggleTabVisibility = (selectedTab: string) => {
		this.setState({
			selectedTab: selectedTab.toLowerCase()
		});

		this.updateConfigInLocalStorage({
			selectedTab: selectedTab
		});
	}

	private getSelectedTabComponent(): ProfilerExtensionInterface {
		let selectedTabName = this.state.selectedTab ? this.state.selectedTab : Object.keys(this.state.extensions)[0];

		if (!(selectedTabName in this.state.extensions)) {
			selectedTabName = 'summaryextension';
		}

		return this.state.extensions[selectedTabName] as ProfilerExtensionInterface || null;
	}

	private getSelectedTabContent = () => {
		const ProfilerExtension = this.getSelectedTabComponent() as any;
		return <ProfilerExtension key={`${ProfilerExtension.name as string}-extension`} config={this.extensionsConfig} />;
	}

	private isTabSelected = (extensionName: string) => {
		return this.state.selectedTab !== null && this.state.selectedTab.toLowerCase() === extensionName.toLowerCase();
	}

	/* eslint-disable max-len */
	public render() {
		return (
			<div id={ProfilerToolbar.TOOLBAR_ELEMENT_ID} class="stylify-ignore">
				<a
					role="button"
					class="
						align-items:center display:flex background-color:$blueLogo
						cursor:pointer justify-content:center padding:4px position:fixed
						transition:background-color__0.3s
						hover:background-color:$blueLogoHover
					"
					onClick={this.toggleProfilerVisibility}
					style={this.state.buttonPosition}
				>
					<svg height="40" viewBox="0 0 123 109" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M100.08 44.4334L96.048 63.7075H113.328V86.3656H91.296L86.544 108.877H63.504L68.256 86.3656H44.352L39.6 108.877H16.56L21.312 86.3656H0V63.7075H26.064L30.096 44.4334H9.216V21.7753H34.704L39.312 0H62.352L57.744 21.7753H81.648L86.256 0H109.296L104.688 21.7753H122.544V44.4334H100.08ZM77.04 44.4334H53.136L49.104 63.7075H73.008L77.04 44.4334Z" fill="white"/>
						<path d="M59.6489 85.616C52.9609 85.616 47.5049 84.1787 43.2809 81.304C39.1156 78.3707 37.0329 74.2347 37.0329 68.896C37.0329 68.368 37.0916 67.576 37.2089 66.52H52.8729C52.6969 68.7493 53.2249 70.5093 54.4569 71.8C55.6889 73.0907 57.5662 73.736 60.0889 73.736C62.3769 73.736 64.1662 73.2373 65.4569 72.24C66.8062 71.2427 67.4809 69.8347 67.4809 68.016C67.4809 66.1387 66.6302 64.6133 64.9289 63.44C63.2862 62.2667 60.7049 60.9467 57.1849 59.48C53.7822 58.072 50.9956 56.752 48.8249 55.52C46.7129 54.2293 44.8649 52.4987 43.2809 50.328C41.6969 48.1573 40.9049 45.4293 40.9049 42.144C40.8462 38.096 41.8436 34.576 43.8969 31.584C45.9502 28.592 48.7956 26.304 52.4329 24.72C56.0702 23.136 60.2356 22.344 64.9289 22.344C69.1529 22.344 72.9076 23.0187 76.1929 24.368C79.4782 25.6587 82.0302 27.5653 83.8489 30.088C85.6676 32.552 86.5769 35.4853 86.5769 38.888C86.5769 39.768 86.5476 40.4133 86.4889 40.824H70.4729C70.5316 40.5893 70.5609 40.2373 70.5609 39.768C70.5609 38.1253 69.9742 36.8053 68.8009 35.808C67.6862 34.752 66.1316 34.224 64.1369 34.224C62.0249 34.224 60.2942 34.752 58.9449 35.808C57.6542 36.8053 57.0089 38.184 57.0089 39.944C57.0089 41.704 57.8302 43.2 59.4729 44.432C61.1156 45.6053 63.6676 46.984 67.1289 48.568C70.5902 50.152 73.4062 51.6187 75.5769 52.968C77.8062 54.3173 79.7129 56.136 81.2969 58.424C82.8809 60.6533 83.6729 63.4107 83.6729 66.696C83.6729 70.3333 82.7049 73.5893 80.7689 76.464C78.8329 79.3387 76.0462 81.5973 72.4089 83.24C68.7716 84.824 64.5182 85.616 59.6489 85.616Z" fill="black"/>
					</svg>
				</a>
				<div
					class={`
						left:0 font-size:16px color:#222 height:100% font-family:arial
						position:fixed top:0 width:100% z-index:1000 display:flex flex-direction:row
						transition:transform__0.5s__ease-in-out content-visibility:auto
						background-color:rgb(245,245,245)
						${this.state.profilerVisible ? '' : 'transform:translateX(-100%)'}
					`}
				>
					<header
						class="
							position:fixed display:flex justify-content:space-between
							background-color:#fff top:0
							left:0 width:100% z-index:1
							box-shadow:0__6px__8px__1px__rgba(0,0,0,0.06)
							lg:background-color:transparent lg:box-shadow:none
						"
					>
						<span>
							<a
								role="button"
								onClick={this.toggleProfilerNavigationVisibility}
								class="
									padding:4px cursor:pointer
									display:inline-block hover:text-decoration:none
									transition:background-color__0.3s color:$grey1
									hover:background-color:$grey3
									lg:display:none
								"
							>
								<i class="sp-icon sp-icon-menu font-size:42px"></i>
							</a>
						</span>
						<a
							role="button"
							onClick={this.toggleProfilerVisibility}
							class="
								cursor:pointer padding:4px display:inline-block hover:text-decoration:none
								transition:background-color__0.3s color:$grey1
								hover:background-color:$grey3
							"
						>
							<i class="sp-icon sp-icon-x font-size:42px"></i>
						</a>
					</header>
					<aside class={`
						position:absolute top:0 left:0 height:100% z-index:1
						background-color:#fff width:300px transition:transform__0.5s__ease-in-out
						box-shadow:0__2px__8px__rgba(0,0,0,0.2)
						lg:position:relative lg:background:none lg:transform:translateX(0) lg:box-shadow:none
						${this.state.profilerNavigationVisible ? 'transform:translateX(0)' : 'transform:translateX(-100%)'}
					`}>
						<div class="text-align:right margin-bottom:12px lg:display:none">
							<a
								role="button"
								onClick={this.toggleProfilerNavigationVisibility}
								class="cursor:pointer"
							>
								<i class="sp-icon sp-icon-x font-size:42px"></i>
							</a>
						</div>
						<div class="padding:12px md:padding:32px height:100% overflow:auto">
							{Object.keys(this.state.extensions).map((extensionName, index) => {
								const extension = this.state.extensions[extensionName];
								const isTabSelected = this.state.selectedTab === null && index === 0 || this.isTabSelected(extensionName);
								return (
									<a
										id={extensionName}
										role="button"
										onClick={() => this.toggleTabVisibility(extensionName)}
										class={`profiler__tab-button hover:text-decoration:none ${isTabSelected ? 'profiler__tab-button--selected' : ''}`}
									>
										{extension.icon === null
											? ''
											: <img src={`data:image/svg+xml;base64,${btoa(extension.icon)}`} class={`profiler__tab-button-icon ${isTabSelected ? 'profiler__tab-button-icon--selected' : ''}`} alt="" />
										}
										<span>{extension.title}</span>
									</a>
								);
							})}
						</div>
					</aside>
					<div
						class="
							display:flex overflow:auto flex-direction:column justify-content:space-between padding:12px padding-top:42px
							md:padding:32px
							width:100%
							lg:width:calc(100%__-__300px)
						"
					>
						<main>
							<h1 class="profiler__tab-title">{this.getSelectedTabComponent().title}</h1>
							<div>{this.getSelectedTabContent()}</div>
						</main>
						<footer class="text-align:center margin-top:40px font-size:1rem color:#aaa lg:width:calc(100%__-__300px)">
							Copyright&nbsp;©&nbsp;2021-{new Date().getFullYear()} Vladimír&nbsp;Macháček
							<span class="display:none md:display:inline-block margin:0__8px">|</span>
							<br class="md:display:none" />
							<a
								href="https://stylifycss.com"
								class="
									color:$blue1 display:inline-block margin-top:8px text-decoration:none
									hover:text-decoration:underline
									md:margin-top:0
								"
							>Stylify.dev</a>
						</footer>
					</div>
				</div>
			</div>
		);
	}
	/* eslint-enable max-len */
}

export const initProfilerToolbar = (config: ProfilerToolbarConfigInterface): void => {
	let profilerToolbarElement = document.querySelector(`#${ProfilerToolbar.TOOLBAR_ELEMENT_ID}`);

	if (!profilerToolbarElement) {
		profilerToolbarElement = document.createElement('div');
		profilerToolbarElement.id = ProfilerToolbar.TOOLBAR_ELEMENT_ID;
		profilerToolbarElement.classList.add('stylify-ignore');

		document.body.append(profilerToolbarElement);
	}

	preact.render(preact.h(ProfilerToolbar, {config: config}), profilerToolbarElement, profilerToolbarElement);
};
