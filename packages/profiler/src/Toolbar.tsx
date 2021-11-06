import { CompilerExtension, RuntimeExtension, SummaryExtension } from './Extensions';
import { Component, h, render } from 'preact';
import type { Profiler } from '.';

export interface ProfilerExtensionPropsInterface {
	toggleTab: (extensionName: string) => void
}

export interface ProfilerExtensionInterface {
	title: string,
	icon?: string
}

export interface ProfilerToolbarConfigInterface {
	extensions: any[],
	profiler: Profiler
}

type ExpandableState = {
	profilerVisible: boolean,
	profilerNavigationVisible: boolean,
	selectedTab: string|null,
	extensions: Record<string, any>
};

class ProfilerToolbar extends Component<any, ExpandableState> {

	public static readonly TOOLBAR_ELEMENT_ID = 'stylify-profiler';

	private readonly LOCAL_STORAGE_ID = 'stylify-profiler'

	private extensionsConfig: ProfilerExtensionPropsInterface = null;

	public constructor({ config }) {
		super();

		config.profiler.addExtension = (extension: string) => {
			this.addExtension(extension, true);
		};

		const configFromLocalStorage = this.getConfigFromLocalStorage();

		this.state = {
			...{
				extensions: {},
				profilerVisible: false,
				profilerNavigationVisible: false,
				selectedTab: null
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
				return this.toggleTabVisibility(`${extensionName}Extension`);
			}
		};
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
		return this.state.extensions[
			this.state.selectedTab ? this.state.selectedTab : Object.keys(this.state.extensions)[0]
		] as ProfilerExtensionInterface;
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
						align-items:center bottom:0 left:0 display:flex background-color:$blueLogo
						cursor:pointer justify-content:center padding:4px position:fixed
						transition:background-color__0.3s
						hover:background-color:$blueLogoHover
					"
					onClick={this.toggleProfilerVisibility}
				>
					<svg version="1.2" viewBox="0 0 50 50" width="50" height="50" class="width:40px height:40px">
						<use href="#img1" x="0" y="0" />
						<path fill="#000000" aria-label="S" d="M24.57 30.13Q23.64 30.13 22.91 29.91Q22.17 29.67 21.5 29.09Q21.32 28.95 21.23 28.76Q21.14 28.58 21.14 28.39Q21.14 28.09 21.35 27.87Q21.57 27.63 21.9 27.63Q22.15 27.63 22.35 27.79Q22.85 28.19 23.34 28.41Q23.84 28.62 24.57 28.62Q25.05 28.62 25.46 28.47Q25.87 28.31 26.12 28.06Q26.37 27.8 26.37 27.47Q26.37 27.07 26.13 26.8Q25.9 26.52 25.41 26.34Q24.92 26.14 24.17 26.03Q23.46 25.93 22.92 25.72Q22.38 25.49 22.01 25.16Q21.65 24.82 21.47 24.37Q21.29 23.91 21.29 23.35Q21.29 22.49 21.72 21.88Q22.17 21.28 22.92 20.96Q23.67 20.64 24.58 20.64Q25.44 20.64 26.16 20.91Q26.9 21.16 27.36 21.55Q27.74 21.86 27.74 22.25Q27.74 22.54 27.52 22.78Q27.29 23.02 26.99 23.02Q26.79 23.02 26.63 22.9Q26.42 22.71 26.07 22.56Q25.71 22.38 25.32 22.28Q24.92 22.16 24.58 22.16Q24.01 22.16 23.62 22.31Q23.24 22.45 23.04 22.7Q22.84 22.95 22.84 23.28Q22.84 23.68 23.06 23.94Q23.3 24.19 23.74 24.35Q24.17 24.49 24.78 24.61Q25.57 24.76 26.16 24.95Q26.77 25.15 27.16 25.47Q27.56 25.77 27.75 26.24Q27.95 26.71 27.95 27.38Q27.95 28.23 27.48 28.85Q27 29.47 26.23 29.8Q25.46 30.13 24.57 30.13Z" />
						<path fill="#ffffff" aria-label="#" d="M12.04 49Q11.03 49 10.42 48.19Q9.88 47.38 10.02 46.23L17.38 3.44Q17.59 2.63 18.13 2.16Q18.67 1.68 19.41 1.68Q20.49 1.68 21.03 2.5Q21.64 3.24 21.44 4.39L14.07 47.24Q14 48.05 13.4 48.53Q12.86 49 12.04 49ZM42.8 17.77L8.87 17.77Q7.92 17.77 7.24 17.16Q6.64 16.49 6.64 15.54Q6.64 14.66 7.24 14.12Q7.92 13.58 8.87 13.58L42.8 13.58Q43.75 13.58 44.35 14.26Q44.96 14.87 44.96 15.81Q44.96 16.69 44.35 17.23Q43.75 17.77 42.8 17.77ZM29.55 49Q28.47 49 27.86 48.19Q27.32 47.38 27.52 46.23L34.89 3.44Q35.03 2.63 35.57 2.16Q36.11 1.68 36.92 1.68Q38 1.68 38.54 2.5Q39.15 3.24 38.95 4.39L31.58 47.24Q31.44 48.05 30.9 48.53Q30.36 49 29.55 49ZM40.16 36.77L6.16 36.77Q5.28 36.77 4.61 36.16Q4 35.48 4 34.6Q4 33.72 4.61 33.18Q5.28 32.64 6.16 32.64L40.16 32.64Q41.11 32.64 41.72 33.25Q42.33 33.86 42.33 34.81Q42.33 35.68 41.72 36.22Q41.11 36.77 40.16 36.77Z" />
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
									display:inline-block
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
								cursor:pointer padding:4px display:inline-block
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
										class={`profiler__tab-button ${isTabSelected ? 'profiler__tab-button--selected' : ''}`}
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
								href="https://stylify.dev"
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

	render(<ProfilerToolbar config={config} />, profilerToolbarElement, profilerToolbarElement);
};
