import { Component } from 'preact';
import EventsEmitter from '../../EventsEmitter';

export default class ConfigurationsVisualizerExtension extends Component {

	private state: Record<string, any> = {
		components: {},
		componentsListVisible: false,

		macros: {},
		macrosListVisible: false,

		variables: {},
		variablesListVisible: false,
	};

	constructor() {
		super();

		this.updateCompilerConfigs(Stylify.Compiler);

		EventsEmitter.addListener('stylify:compiler:configured', (event) => {
			this.updateCompilerConfigs(event.detail.compiler);
		});

	/* 	EventsEmitter.addListener('stylify:runtime:configured', (event) => {
			this.setState({
				runtimeConfig: event.detail.config
			})
		}); */
	}

	private updateCompilerConfigs = (Compiler) => {
		this.setState({
			components: Compiler.components,
			helpers: Compiler.helpers,
			macros: Compiler.macros,
			variables: Compiler.variables,
		});
	}

	private toggleDetailVisibility = (name) => {
		const newState = {};
		newState[name + 'Visible'] = !this.state[name + 'Visible'];
		this.setState(newState);
	}

	public render() {
		return (
			<>
				<div class="profiler-extension">
					<a role="button" title="Macros" class="profiler-extension__button" onClick={() => this.toggleDetailVisibility('macrosList')}>
						<span>♻️</span> <strong>{Object.keys(this.state.macros).length}</strong>
					</a>
					<div class={`display:${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'flex' : 'none'} profiler-extension__dropdown`}>
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
												<pre><code>{this.state.macros[macroRegExp].toString().replaceAll(/  |\t\t/ig, ' ')}</code></pre>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>

				<div class="profiler-extension">
					<a role="button" title="Variables" class="profiler-extension__button" onClick={() => this.toggleDetailVisibility('variablesList')}>
						<span>💲</span> <strong>{Object.keys(this.state.variables).length}</strong>
					</a>
					<div class={`display:${this.state.variablesListVisible && Object.keys(this.state.variables).length ? 'flex' : 'none'} profiler-extension__dropdown`}>
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
					<a role="button" title="Helpers" class="profiler-extension__button" onClick={() => this.toggleDetailVisibility('helpersList')}>
						<span>🛠️</span> <strong>{Object.keys(this.state.helpers).length}</strong>
					</a>
					<div class={`display:${this.state.helpersListVisible && Object.keys(this.state.helpers).length ? 'flex' : 'none'} profiler-extension__dropdown`}>
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

				<div class="profiler-extension">
					<a role="button" title="Components" class="profiler-extension__button" onClick={() => this.toggleDetailVisibility('componentsList')}>
						<span>⚛️</span> <strong>{Object.keys(this.state.components).length}</strong>
					</a>
					<div class={`display:${this.state.componentsListVisible && Object.keys(this.state.components).length ? 'flex' : 'none'} profiler-extension__dropdown`}>
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
											<td class="padding:8px white-space:nowrap max-width:800px overflow-x:auto word-spacing:24px">{this.state.components[componentName]}</td>
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
