import { h, Component } from 'preact';

export default class DomNodesCounterExtension extends Component<any> {

	private profilerElement: HTMLElement = document.querySelector('#stylify-profiler');

	public state: Record<string, any> = {
		recommendedDomNodesCount: 1500,
		totalDomNodesCount: 0
	}

	constructor(config) {
		super();

		document.addEventListener('DOMContentLoaded', () => {
			this.updateDomNodesCount();
		});

		const observer = new MutationObserver(() => {
			this.updateDomNodesCount();
		});

		observer.observe(document.documentElement, {
			attributeFilter: ['class'],
			childList: true,
			subtree: true
		});
	}

	private updateDomNodesCount = () => {
		const count = document.getElementsByTagName('*').length - this.profilerElement.getElementsByTagName('*').length;
		this.setState({ totalDomNodesCount: count })
	}

	public render() {
		return (
			<div class="profiler-extension">
				<div role="button" title="Dom nodes counter" class="profiler-extension__button">
					<i class="sp-icon sp-icon-link profiler-extension__button-icon"></i>
					<strong class={`${this.state.totalDomNodesCount > this.state.recommendedDomNodesCount ? 'color:red' : '' } profiler-extension__button-label`}>{this.state.totalDomNodesCount}</strong>
				</div>
			</div>
		);
	}

}
