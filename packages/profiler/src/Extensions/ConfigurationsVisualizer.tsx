import type { Compiler } from '@stylify/stylify';
import { Component } from 'preact';
import { ProfilerExtensionPropsInterface } from '..';

export class ConfigurationsVisualizerExtension extends Component<any> {

	public state: Record<string, any> = {
		components: {},
		componentsListVisible: false,

		macros: {},
		macrosListVisible: false,

		variables: {},
		variablesListVisible: false
	};

	constructor(props: ProfilerExtensionPropsInterface) {
		super();

		this.updateCompilerConfigs(props.config.stylify.compiler);

		document.addEventListener('stylify:compiler:configured', (event: any): void => {
			this.updateCompilerConfigs(event.detail.compiler);
		});
	}

	private updateCompilerConfigs = (compiler: Compiler): void => {
		this.setState({
			components: compiler.components,
			helpers: compiler.helpers,
			macros: compiler.macros,
			variables: compiler.variables
		});
	}

	private toggleDetailVisibility = (name: string): void => {
		this.setState({
			[`${name}Visible`]: !this.state[`${name}Visible`]
		});
	}

	/* eslint-disable max-len */
	public render() {
		return (
			<>
				<div class="profiler-extension">
					<a role="button" title="Macros" class={`${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`} onClick={() => this.toggleDetailVisibility('macrosList')}>
						<i class="sp-icon sp-icon-aperture profiler-extension__button-icon"></i>
						<strong class="profiler-extension__button-label">{Object.keys(this.state.macros).length}</strong>
					</a>
					<div class={`${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'visibility:visible' : 'visibility:hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Macro</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.macros).map((macroRegExp) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto">
												<pre><code>{macroRegExp}{this.state.macros[macroRegExp].toString().replaceAll(/ {2}|\t\t/ig, ' ')}</code></pre>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				<div class="profiler-extension">
					<a role="button" title="Variables" class={`${this.state.variablesListVisible && Object.keys(this.state.variables).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`} onClick={() => this.toggleDetailVisibility('variablesList')}>
						<i class="sp-icon sp-icon-dollar-sign profiler-extension__button-icon"></i>
						<strong class="profiler-extension__button-label">{Object.keys(this.state.variables).length}</strong>
					</a>
					<div class={`${this.state.variablesListVisible && Object.keys(this.state.variables).length ? 'visibility:visible' : 'visibility:hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Name</th>
									<th class="padding:8px">Value</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.variables).map((variableName) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap">{variableName}</td>
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto">{this.state.variables[variableName]}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				<div class="profiler-extension">
					<a role="button" title="Components" class={`${this.state.componentsListVisible && Object.keys(this.state.components).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`} onClick={() => this.toggleDetailVisibility('componentsList')}>
						<i class="sp-icon sp-icon-layout profiler-extension__button-icon"></i>
						<strong class="profiler-extension__button-label">{Object.keys(this.state.components).length}</strong>
					</a>
					<div class={`${this.state.componentsListVisible && Object.keys(this.state.components).length ? 'visibility:visible' : 'visibility:hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Name</th>
									<th class="padding:8px">Classes</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.components).map((componentName) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap">{componentName}</td>
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto word-spacing:24px">{this.state.components[componentName].selectors.join(' ')}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				<div class="profiler-extension">
					<a role="button" title="Helpers" class={`${this.state.helpersListVisible && Object.keys(this.state.helpers).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`} onClick={() => this.toggleDetailVisibility('helpersList')}>
						<i class="sp-icon sp-icon-tool profiler-extension__button-icon"></i>
						<strong class="profiler-extension__button-label">{Object.keys(this.state.helpers).length}</strong>
					</a>
					<div class={`${this.state.helpersListVisible && Object.keys(this.state.helpers).length ? 'visibilit:visible' : 'visibility:hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Helper</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.helpers).map((helperName) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto">
												<pre><code>{this.state.helpers[helperName].toString().replaceAll(/ {2}|\t\t/ig, ' ')}</code></pre>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</>
		);
	}

}
