import { Component } from 'preact';
import { ProfilerExtensionPropsInterface } from '..';

export default class CacheInfoExtension extends Component<any> {

	private stylify = null;

	private openCodeInNewWindow = null;

	public state: Record<string, any> = {
		cacheInfoVisible: false,
		cacheList: []
	}

	constructor(props: ProfilerExtensionPropsInterface) {
		super();

		this.stylify = props.config.stylify;
		this.openCodeInNewWindow = props.config.openCodeInNewWindow;

		document.addEventListener('stylify:runtime:hydrated', (event: any) => {
			this.state.cacheList.push(this.stringifyCache(event.data.cache));

			this.setState({
				cacheList: this.state.cacheList
			});
		});
	}

	public toggleCacheInfoVisibility = (): void => {
		this.setState({
			cacheInfoVisible: !this.state.cacheInfoVisible
		});
	}

	public convertSizeToKb(size: number, precision = 1): string {
		return (size / 1000).toFixed(precision);
	}

	public openActualCacheInNewWindow = (): void => {
		this.openCodeInNewWindow(this.stringifyCache(this.stylify.runtime.CompilationResult.serialize()), 'json');
	}

	private stringifyCache = (cache: Record<string, any>): string => {
		return JSON.stringify(cache, null, 4);
	}

	/* eslint-disable max-len */
	public render() {
		return (
			<div class="profiler-extension">
				<a role="button" onClick={this.toggleCacheInfoVisibility} title="Cache info" class={`${this.state.cacheInfoVisible ? 'profiler-extension__button--active' : ''} profiler-extension__button`}>
					<i class="sp-icon sp-icon-layers profiler-extension__button-icon"></i>
					<strong class={`${this.state.cacheSize > 50 ? 'color:red' : '' } profiler-extension__button-label`}>{this.state.cacheList.length}</strong>
				</a>
				<div class={`${this.state.cacheInfoVisible ? 'display:block' : 'display:none'} profiler-extension__dropdown`}>
					<table>
						<thead>
							<th>Id</th>
							<th>Size</th>
						</thead>
						<tbody>
							{this.state.cacheList.map((cache, i: number) => {
								return (
									<tr>
										<td>{i}</td>
										<td>
											<a role="button" class="profiler-extension__link" onClick={() => {this.openCodeInNewWindow(cache, 'json');}}>Show: {this.convertSizeToKb(cache.length)} Kb</a>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					<hr />
					<div class="display:flex">
						<a role="button" class="profiler-extension__link margin-left:8px" onClick={() => {this.openActualCacheInNewWindow();}}>Dump actual cache</a>
					</div>
				</div>
			</div>
		);
	}

}
