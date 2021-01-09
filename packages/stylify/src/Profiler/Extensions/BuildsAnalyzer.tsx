import { Component } from 'preact';
import EventsEmitter from '../../EventsEmitter';

const state = {
	cssInBase64: null,
	lastRepaintTime: 0,
	totalRepaintTime: 0,
	actualSize: 0,
	builds: [],
	buildsListVisible: false
};

const calculateTotalRepaintTime = (repaintTime, totalRepaintTime = 0): Record<string, number> => {
	totalRepaintTime = totalRepaintTime + repaintTime;

	return {
		lastRepaintTime: repaintTime,
		totalRepaintTime: totalRepaintTime
	}
}

const processBuildInfo = (actualState: Record<string, any>, eventDetail: Record<string, any>): Record<string, any> => {
	const builds = actualState.builds;
	const css = eventDetail.css;
	const cssSize = css.length;
	const buildSize = cssSize - actualState.actualSize;

	if (buildSize === 0) {
		return;
	}

	builds.push({
		size: buildSize,
		repaintTime: actualState.lastRepaintTime
	});;

	return {
		builds: builds,
		cssSize: cssSize
	};
}


let domContentLoaded = false;

if (typeof window !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => domContentLoaded = true);

	EventsEmitter.addListener('stylify:repaint:end', (event) => {
		if (domContentLoaded) {
			return;
		}

		const repaintTimes = calculateTotalRepaintTime(event.detail.repaintTime, state.lastRepaintTime);
		state.lastRepaintTime = repaintTimes.lastRepaintTime;
		state.totalRepaintTime = repaintTimes.totalRepaintTime;
	});

	EventsEmitter.addListener('stylify:css:injected', (event) => {
		if (domContentLoaded) {
			return;
		}

		const updatedBuildsInfo = processBuildInfo(state, event.detail);

		state.builds = updatedBuildsInfo.builds;
		state.actualSize = updatedBuildsInfo.cssSize;
	});
}

export default class BuildsAnalyzerExtension extends Component {

	private state: Record<string, any> = state;

	constructor() {
		super();

		EventsEmitter.addListener('stylify:repaint:end', (event) => {
			this.setState(calculateTotalRepaintTime(event.detail.repaintTime, this.state.lastRepaintTime));
		});

 		EventsEmitter.addListener('stylify:css:injected', (event) => {
			const updatedBuildsInfo = processBuildInfo(this.state, event.detail);

			this.setState({
				builds: updatedBuildsInfo.builds,
				actualSize: updatedBuildsInfo.cssSize
			});
		});
	}

	public getGeneratedCssFromPage(): string {
		const stylifyCssElement = document.querySelector('#stylify-css');
		return stylifyCssElement ? stylifyCssElement.innerHTML : '';
	}

	public convertCssSizeToKb(size: number): string {
		return (size / 1000).toPrecision(2) + ' Kb';
	}

	public convertTimeToSeconds(time: number): string {
		return time.toPrecision(2) + ' ms';
	}

	public toggleBuildsListVisibility = () => {
		this.setState({
			buildsListVisible: !this.state.buildsListVisible
		})
	}

	public openGeneratedCssInNewWindow = () => {
		let cssWindow = window.open("");

		cssWindow.document.write('<pre><code>' + this.getGeneratedCssFromPage() + '</code></pre>');
	}

	public render() {
		return (
			<div class="profiler-extension">
				<a role="button" onClick={this.toggleBuildsListVisibility} class="profiler-extension__button">
					<strong title="Builds count" class="margin-right:8px">🔄 {this.state.builds.length}</strong>
					|<strong title="Total builds CSS size" class="margin:0__8px">📦 {this.convertCssSizeToKb(this.state.actualSize)}</strong>
					|<strong title="Total builds repaint time" class="margin-left:8px">⏱️ {this.convertTimeToSeconds(this.state.totalRepaintTime)}</strong>
				</a>
				<div class={`display:${this.state.buildsListVisible ? 'block' : 'none'} profiler-extension__dropdown`}>
					<table class="text-align:left white-space:nowrap" cellspacing="0">
						<thead>
							<tr>
								<th class="padding:8px">Build</th>
								<th class="padding:8px">Size</th>
								<th class="padding:8px">Time</th>
							</tr>
						</thead>
						<tbody>
							{this.state.builds.map((build, i) => {
								return (
									<tr class="hover:background:#333">
										<td class="padding:8px">{i}</td>
										<td class="padding:8px">{this.convertCssSizeToKb(build.size)}</td>
										<td class="padding:8px">{this.convertTimeToSeconds(build.repaintTime)}</td>
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
