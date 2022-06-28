import {
	HideableElement,
	InlineCard,
	InlineCardButtonsWrapper,
	InlineCardIcon,
	InlineCardTitle,
	InlineCardsWrapper,
	utils,
	preact
} from '..';
import { JSXInternal } from 'preact/src/jsx';
import type { ProfilerExtensionPropsInterface } from '..';

const { h } = preact;

interface ExpandableStateInterface {
	recommendedDomNodesCount: number,
	recommendedCssSize: number,
	totalDomNodesCount: number,
	cssSize: number,
	cacheElementsCount: number,
	runtimeVersion: string
}

export class SummaryExtension extends preact.Component<ProfilerExtensionPropsInterface, ExpandableStateInterface> {

	public static title = 'Summary';

	public static icon = `
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
			<path fill="#000" d="M76.352 262.752c-7.552 5.888-12.352 15.008-12.352 25.248v352c0 26.496 10.784 50.56 28.128 67.872s41.376 28.128 67.872 28.128h448c26.496 0 50.56-10.784 67.872-28.128s28.128-41.376 28.128-67.872v-352c-0.032-9.6-4.288-18.976-12.352-25.248l-288-224c-11.456-8.8-27.552-9.12-39.296 0zM512 672v-288c0-17.664-14.336-32-32-32h-192c-17.664 0-32 14.336-32 32v288h-96c-8.832 0-16.8-3.552-22.624-9.376s-9.376-13.792-9.376-22.624v-336.352l256-199.104 256 199.104v336.352c0 8.832-3.552 16.8-9.376 22.624s-13.792 9.376-22.624 9.376zM320 672v-256h128v256z"></path>
		</svg>
	`;

	private profilerElement: HTMLElement = document.querySelector('#stylify-profiler');

	public config: ProfilerExtensionPropsInterface = null;

	constructor(props) {
		super();

		this.config = props.config as ProfilerExtensionPropsInterface;

		const getNewStateInfo = (): Partial<ExpandableStateInterface> => {
			return {
				runtimeVersion: this.getRuntimeVersion(),
				totalDomNodesCount: this.getDomNodesCount(),
				cssSize: this.getCssSize(),
				cacheElementsCount: this.getCacheElementsCount()
			};
		};

		this.state = {
			...{
				recommendedDomNodesCount: 1500,
				recommendedCssSize: 50000,
				totalDomNodesCount: 0,
				cssSize: 0,
				cacheElementsCount: 0,
				runtimeVersion: null
			},
			...getNewStateInfo()
		};

		document.addEventListener('stylify:ready', (): void => {
			this.setState(getNewStateInfo());
		});

		document.addEventListener('stylify:repainted', (): void => {
			this.setState(getNewStateInfo());
		});
	}

	private getRuntimeVersion(): string|null {
		const runtime = utils.getStylifyRuntime();
		return runtime && 'version' in runtime ? runtime.version as string : null;
	}

	private getCacheElementsCount = (): number => {
		return document.querySelectorAll('.stylify-runtime-cache').length;
	}

	private getStylifyCssElementContent = () => {
		const cssElement = document.querySelector('#stylify-css');
		return cssElement ? cssElement.innerHTML.trim() : null;
	}

	private getCssSize = (): number => {
		const cssElementContent = this.getStylifyCssElementContent();

		if (cssElementContent === null) {
			return 0;
		}

		return cssElementContent.length;
	};

	private getDomNodesCount = (): number => {
		const domNodesCount = document.getElementsByTagName('*').length;
		return this.profilerElement
			? domNodesCount - this.profilerElement.getElementsByTagName('*').length
			: domNodesCount;
	}

	private openGeneratedCssInNewWindow = () => {
		utils.openCodeInNewWindow(this.getStylifyCssElementContent(), 'css', 'generated css');
	};

	/* eslint-disable max-len */
	public render(): JSXInternal.Element {
		return (
			<preact.Fragment>
				<InlineCardsWrapper>
					<InlineCard>
						<InlineCardIcon icon="document-file-css" color="#2a74b8" />
						<div>
							<InlineCardTitle><span>CSS inside #stylify-css</span></InlineCardTitle>
							<HideableElement visible={this.state.cssSize === 0}><span>Stylify CSS element not found.</span></HideableElement>
							<HideableElement visible={this.state.cssSize !== 0}>
								<strong class={`${this.state.cssSize > 50000 ? 'color:red' : 'color:green' }`}>{utils.convertSizeToKb(this.state.cssSize)}</strong>
								<span>{` (recommended limit ${utils.convertSizeToKb(this.state.recommendedCssSize)})`}</span>
								<div class="margin-top:12px">
									<a role="button" class="white-space:nowrap" onClick={() => this.openGeneratedCssInNewWindow()}>Show CSS</a>&nbsp;|&nbsp;<a href={`data:text/plain;charset=utf-8,${encodeURIComponent(this.getStylifyCssElementContent())}`} download="stylify-runtime-css.css" class="white-space:nowrap">Export CSS</a>
								</div>
							</HideableElement>
						</div>
					</InlineCard>
					<InlineCard>
						<InlineCardIcon icon="activity" color="#4eb539" />
						<div>
							<InlineCardTitle><span>Runtime</span></InlineCardTitle>
							<div>
								<HideableElement visible={typeof this.state.runtimeVersion !== null}>
									<InlineCardButtonsWrapper>
										<a role="button" class="white-space:nowrap" onClick={() => this.config.toggleTab('compilerExtension')}>Show Compiler config</a><span> | </span><a role="button" class="white-space:nowrap" onClick={() => this.config.toggleTab('runtimeExtension')}>Show Runtime info</a>
									</InlineCardButtonsWrapper>
								</HideableElement>
								<HideableElement visible={this.state.runtimeVersion === null}><span>Not detected.</span></HideableElement>
							</div>
						</div>
					</InlineCard>
					<InlineCard>
						<InlineCardIcon icon="document-file-html" color="#e65127" />
						<div>
							<InlineCardTitle><span>DOM nodes count</span></InlineCardTitle>
							<div>
								<strong class={`${this.state.totalDomNodesCount > this.state.recommendedDomNodesCount ? 'color:red' : 'color:green' }`}>{this.state.totalDomNodesCount}</strong>
								<span>{` (recommended limit ${this.state.recommendedDomNodesCount})`}</span>
							</div>
						</div>
					</InlineCard>
					<InlineCard visible={this.state.runtimeVersion !== null}>
						<InlineCardIcon icon="layers" color="#e7a328" />
						<div>
							<InlineCardTitle><span>Cache elements count</span></InlineCardTitle>
							<HideableElement visible={this.state.cacheElementsCount === 0}><span>Not detected</span></HideableElement>
							<HideableElement visible={this.state.cacheElementsCount !== 0}>
								<strong>{this.state.cacheElementsCount}</strong>
								<InlineCardButtonsWrapper>
									<a role="button" class="white-space:nowrap" onClick={(): void => this.config.toggleTab('runtimeExtension')}>Show cache</a>
								</InlineCardButtonsWrapper>
							</HideableElement>
						</div>
					</InlineCard>
				</InlineCardsWrapper>
			</preact.Fragment>
		);
	}

}
