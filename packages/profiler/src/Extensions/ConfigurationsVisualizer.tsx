import { h, render, Component } from 'preact';
import { StylifyConfigInterface } from '@stylify/stylify';
import { ProfilerExtensionPropsInterface } from '..';

export default class ConfigurationsVisualizerExtension extends Component<any> {

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

		props.config.stylify.hooks.addHook('stylify:compiler:configured', (data: StylifyConfigInterface) => {
			this.updateCompilerConfigs(data.compiler);
		});
	}

	private updateCompilerConfigs = (Compiler) => {
		this.setState({
			components: Compiler.components,
			helpers: Compiler.helpers,
			macros: Compiler.macros,
			variables: Compiler.variables
		});
	}

	private toggleDetailVisibility = (name: string) => {
		const newState = {};
		newState[`${name} Visible`] = !this.state[`${name} Visible`];
		this.setState(newState);
	}

	public render() {
		return (
			<>
				<div class="profiler-extension">
					<a role="button" title="Macros" class={`${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`} onClick={() => this.toggleDetailVisibility('macrosList')}>
						<i class="sp-icon sp-icon-aperture profiler-extension__button-icon"></i>
						<strong class="profiler-extension__button-label">{Object.keys(this.state.macros).length}</strong>
					</a>
					<div class={`visibility:${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Macro</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.macros).map((macroRegExp, i) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto">
												<pre><code>{macroRegExp}{this.state.macros[macroRegExp].toString().replaceAll(/  |\t\t/ig, ' ')}</code></pre>
											</td>
										</tr>
									)
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
					<div class={`visibility:${this.state.variablesListVisible && Object.keys(this.state.variables).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Name</th>
									<th class="padding:8px">Value</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.variables).map((variableName, i) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap">{variableName}</td>
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto">{this.state.variables[variableName]}</td>
										</tr>
									)
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
					<div class={`visibility:${this.state.componentsListVisible && Object.keys(this.state.components).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Name</th>
									<th class="padding:8px">Classes</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.components).map((componentName, i) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap">{componentName}</td>
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto word-spacing:24px">{this.state.components[componentName].selectors.join(' ')}</td>
										</tr>
									)
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
					<div class={`visibility:${this.state.helpersListVisible && Object.keys(this.state.helpers).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`}>
						<table>
							<thead>
								<tr>
									<th class="padding:8px">Helper</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.helpers).map((helperName, i) => {
									return (
										<tr class="hover:background:#333">
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto">
												<pre><code>{this.state.helpers[helperName].toString().replaceAll(/  |\t\t/ig, ' ')}</code></pre>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			</>
		);
	}

}
