// @ts-nocheck

import { h, Component } from 'preact';

export default class BuildsAnalyzerExtension extends Component {

	private openCodeInNewWindow = null;

	private state: Record<string, any> = {
		cssInBase64: null,
		totalRepaintTime: 0,
		actualSize: 0,
		builds: [],
		buildsListVisible: false
	}

	constructor(props) {
		super();

		this.openCodeInNewWindow = props.config.openCodeInNewWindow;
		props.config.stylify.EventsEmitter.addListener('stylify:runtime:repainted', (data) => {
			const builds = this.state.builds;
			const buildSize = this.state.actualSize === 0 ? data.css.length : data.css.length - this.state.actualSize;

			if (buildSize === 0) {
				return;
			}

			builds.push({
				content: data.content,
				size: buildSize,
				repaintTime: data.repaintTime,
				details: data.compilerResult.lastBuildInfo
			});

			this.setState({
				totalRepaintTime: this.state.totalRepaintTime + data.repaintTime,
				actualSize: this.state.actualSize + buildSize,
				builds: builds
			});
		});

	}

	public getGeneratedCssFromPage(): string {
		const stylifyCssElement = document.querySelector('#stylify-css');
		return stylifyCssElement ? stylifyCssElement.innerHTML : '';
	}

	public convertSizeToKb(size: number, precision: number = 1): string {
		return (size / 1000).toFixed(precision) + ' Kb';
	}

	public convertTimeToSeconds(time: number, precision: number = 1): string {
		return time.toFixed(precision) + ' ms';
	}

	public toggleBuildsListVisibility = () => {
		this.setState({
			buildsListVisible: !this.state.buildsListVisible
		})
	}

	public openProcessedContentInNewWindow(content) {
		const div = document.createElement('div');
		div.innerHTML = decodeURIComponent(content);
		this.openCodeInNewWindow(div.innerHTML, null, 'processed selectors');
	}

	public openGeneratedCssInNewWindow = () => {
		this.openCodeInNewWindow(this.getGeneratedCssFromPage(), 'css', 'generated css')
	}

	public render() {
		return (
			<div class="profiler-extension">
				<a role="button" onClick={this.toggleBuildsListVisibility} class={`${this.state.buildsListVisible ? 'profiler-extension__button--active' : ''} profiler-extension__button`}>
					<strong title="Builds count" class="margin-right:8px"><i class="sp-icon sp-icon-refresh-cw profiler-extension__button-icon"></i><span class="profiler-extension__button-label">{this.state.builds.length}</span></strong>
					|<strong title="Total builds CSS size" class="margin:0__8px"><i class="sp-icon sp-icon-archive profiler-extension__button-icon"></i><span class="profiler-extension__button-label">{this.convertSizeToKb(this.state.actualSize)}</span></strong>
					|<strong title="Total builds repaint time" class="margin-left:8px"><i class="sp-icon sp-icon-clock profiler-extension__button-icon"></i><span class="profiler-extension__button-label">{this.convertTimeToSeconds(this.state.totalRepaintTime)}</span></strong>
				</a>
				<div class={`display:${this.state.buildsListVisible ? 'block' : 'none'} profiler-extension__dropdown`}>
					<table class="text-align:left white-space:nowrap" cellspacing="0">
						<thead>
							<tr>
								<th class="padding:8px">Build</th>
								<th class="padding:8px">Size</th>
								<th class="padding:8px">Time</th>
								<th class="padding:8px" title="Processed content">Content</th>
								<th class="padding:8px" title="Processed selectors">Selectors</th>
								<th class="padding:8px" title="Processed components">Components</th>
							</tr>
						</thead>
						<tbody>
							{this.state.builds.map((build, i) => {
								return (
									<tr class="hover:background:#333">
										<td class="padding:8px">{i}</td>
										<td class="padding:8px">{this.convertSizeToKb(build.size)}</td>
										<td class="padding:8px">{this.convertTimeToSeconds(build.repaintTime)}</td>
										<td class="padding:8px">
											<a
												role="button"
												onClick={() => {this.openProcessedContentInNewWindow(encodeURIComponent(build.content))}}
												class="profiler-extension__link"
											>
												Show({this.convertSizeToKb(build.content.length)})
											</a>
										</td>
										<td class="padding:8px">
											{build.details.processedSelectors.length === 0 ? (
												'---'
											) : (
												<a
													role="button"
													onClick={() => {this.openProcessedContentInNewWindow(encodeURIComponent(build.details.processedSelectors.sort().join('\n')))}}
													class="profiler-extension__link"
												>
													Show({build.details.processedSelectors.length})
												</a>
											)}
										</td>
										<td class="padding:8px">
											{build.details.processedComponents.length === 0 ? (
												'---'
											) : (
												<a
													role="button"
													onClick={() => {this.openProcessedContentInNewWindow(encodeURIComponent(build.details.processedComponents.sort().join('\n')))}}
													class="profiler-extension__link"
												>
													Show({build.details.processedComponents.length})
												</a>
											)}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
					<div class="border-top:1px__solid__#444 padding-top:8px">
						<a
							href={`data:text/plain;charset=utf-8,${encodeURIComponent(this.getGeneratedCssFromPage())}`}
							download="stylify-generated.css"
							class="profiler-extension__link"
						>
							Export CSS
						</a>
						|
						<a
							role="button"
							onClick={this.openGeneratedCssInNewWindow}
							class="profiler-extension__link margin-left:8px"
						>
							Show CSS
						</a>
					</div>
				</div>
			</div>
		);
	}

}
