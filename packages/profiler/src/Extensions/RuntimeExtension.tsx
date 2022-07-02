import {
	Card,
	CardTitle,
	HideableElement,
	InlineCard,
	InlineCardIcon,
	InlineCardTitle,
	InlineCardsWrapper,
	utils,
	preact
} from '..';
import type {
	CssRecord,
	SerializedCompilationResultInterface
} from '@stylify/stylify';
import { JSXInternal } from 'preact/src/jsx';
import type { ProfilerExtensionPropsInterface } from '..';

const { h } = preact;

interface ExpandableStateInterface {
	dev: boolean,
	repaintTimeout: number,
	loadedCache: string[],
	// Compilation result
	processedSelectors: Record<string, CssRecord>,
	processedComponents: Record<string, string>,
	cache: SerializedCompilationResultInterface
}

export class RuntimeExtension extends preact.Component<ProfilerExtensionPropsInterface, ExpandableStateInterface> {

	public static title = 'Runtime';

	public static icon = `
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
			<path fill="#000" d="M704 352h-128c-14.048 0-25.984 9.056-30.368 21.888l-65.632 196.928-161.632-484.928c-5.6-16.768-23.712-25.824-40.48-20.256-9.92 3.296-17.12 10.976-20.256 20.256l-88.704 266.112h-104.928c-17.664 0-32 14.336-32 32s14.336 32 32 32h128c13.536-0.096 25.92-8.544 30.368-21.888l65.632-196.928 161.632 484.928c3.136 9.28 10.336 16.928 20.224 20.224 16.768 5.6 34.88-3.488 40.48-20.224l88.736-266.112h104.928c17.664 0 32-14.336 32-32s-14.336-32-32-32z"></path>
		</svg>
	`;

	constructor() {
		super();

		this.state = {
			...{
				// Runtime
				dev: false,
				repaintTimeout: 0,
				loadedCache: [],
				// Compilation result
				processedSelectors: {},
				processedComponents: {},
				cache: {}
			},
			...this.getRuntimeInfo()
		};
	}

	public componentDidMount(): void {
		document.addEventListener('stylify:ready', (): void => {
			this.setState(this.getRuntimeInfo());
		});

		document.addEventListener('stylify:repainted', (): void => {
			this.setState(this.getRuntimeInfo());
		});
	}

	private getRuntimeInfo(): Record<string, any> {
		const runtime = utils.getStylifyRuntime();

		if (!runtime) {
			return {};
		}

		const loadedCache = [];
		const processedSelectors = {};
		const processedComponents = {};
		let cache = {};

		if (runtime.compilationResult) {
			cache = runtime.compilationResult.serialize();
			for (const selector in runtime.compilationResult.selectorsList) {
				processedSelectors[selector] = runtime.compilationResult.selectorsList[selector].cache;
			}

			for (const component in runtime.compilationResult.componentsList) {
				processedComponents[component] = runtime.compilationResult.componentsList[component];
			}

			for (const cacheElement of document.querySelectorAll('.stylify-runtime-cache')) {
				loadedCache.push(cacheElement.innerHTML.trim());
			}
		}

		return {
			dev: runtime.dev,
			repaintTimeout: runtime.repaintTimeout || 'Unknown',
			loadedCache: loadedCache,
			processedSelectors: processedSelectors,
			processedComponents: processedComponents,
			cache: cache
		};
	}

	/* eslint-disable max-len */
	public render(): JSXInternal.Element {
		return (
			<preact.Fragment>
				<InlineCardsWrapper>
					<InlineCard visible={typeof this.state.repaintTimeout !== 'undefined'}>
						<InlineCardIcon color="#4eb539" icon="clock" />
						<div>
							<InlineCardTitle><span>Repaint timeout</span></InlineCardTitle>
							<div>
								<strong class="color:green">{`${this.state.repaintTimeout} ms`}</strong>
							</div>
						</div>
					</InlineCard>
					<InlineCard visible={this.state.dev !== null}>
						<InlineCardIcon color="#4eb539" icon="circle" />
						<div>
							<InlineCardTitle><span>Environment</span></InlineCardTitle>
							<div>
								<strong class="color:green">{this.state.dev ? 'Development' : 'Production'}</strong>
							</div>
						</div>
					</InlineCard>
					<InlineCard visible={this.state.cache !== null}>
						<InlineCardIcon color="#4eb539" icon="layers" />
						<div>
							<InlineCardTitle><span>Actual cache</span></InlineCardTitle>
							<div>
								<span>{`Size: ${utils.convertSizeToKb(JSON.stringify(this.state.cache).length)}`}</span>&nbsp;|&nbsp;<a href={`data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(this.state.cache, null, 4))}`} download="stylify-runtime-cache-actual.json">Export Cache</a>
							</div>
						</div>
					</InlineCard>
				</InlineCardsWrapper>

				<Card visible={Object.keys(this.state.processedSelectors).length > 0}>
					<CardTitle><span>{`Processed selectors (${Object.keys(this.state.processedSelectors).length})`}</span></CardTitle>
					<div class={`${Object.keys(this.state.processedSelectors).length ? '' : 'display:none'} profiler__table-wrapper`}>
						<table>
							<thead>
								<tr>
									<th>Selector</th>
									<th>CSS</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.processedSelectors).sort().map((selector: string) => {
									return (
										<tr>
											<td class="word-break:break-word width:320px">{selector}</td>
											<td class="white-space:nowrap width:calc(100%__-__320px)">
												<pre>{this.state.processedSelectors[selector]}</pre>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<HideableElement visible={Object.keys(this.state.processedSelectors).length === 0}>
						<span>No selectors were processed.</span>
					</HideableElement>
				</Card>

				<Card visible={Object.keys(this.state.processedComponents).length > 0}>
					<CardTitle><span>{`Processed components (${Object.keys(this.state.processedComponents).length})`}</span></CardTitle>
					<div class={`${Object.keys(this.state.processedComponents).length ? '' : 'display:none'} profiler__table-wrapper`}>
						<table>
							<thead>
								<tr>
									<th>Component</th>
									<th>CSS</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.processedComponents).sort().map((component: string) => {
									return (
										<tr>
											<td class="word-break:break-word width:320px">{component}</td>
											<td class="white-space:nowrap width:calc(100%__-__320px)">
												<pre>{this.state.processedComponents[component]}</pre>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<HideableElement visible={Object.keys(this.state.processedComponents).length === 0}>
						<span>No components were processed.</span>
					</HideableElement>
				</Card>

				<Card visible={this.state.loadedCache.length !== 0}>
					<CardTitle><span>{`Loaded cache (${this.state.loadedCache.length})`}</span></CardTitle>
					<HideableElement visible={this.state.loadedCache.length !== 0}>
						{this.state.loadedCache.map((loadedCache: string, index) => {
							return (
								<div class="margin-bottom:48px">
									<p>
										<span>{`Size ${utils.convertSizeToKb(loadedCache.length)}`}</span>&nbsp;|&nbsp;<a href={`data:text/plain;charset=utf-8,${encodeURIComponent(loadedCache)}`} download={`stylify-runtime-cache-${index}.json`}>Export Cache</a>
									</p>
									<pre class="max-height:400px">{loadedCache}</pre>
								</div>
							);
						})}
					</HideableElement>
					<HideableElement visible={this.state.loadedCache.length === 0}>
						<span>No cache was loaded.</span>
					</HideableElement>
				</Card>
			</preact.Fragment>
		);
	}

}
