
import { Card, CardTitle, HideableElement, TableWrapper, utils, preact } from '..';
import type { ComponentsInterface, PlainSelectorInterface } from '@stylify/stylify';
import { JSXInternal } from 'preact/src/jsx';
import type { ProfilerExtensionPropsInterface } from '../Toolbar';

const { h } = preact;

interface ExpandableStateInterface {
	mangleSelectors: boolean,
	dev: false,
	colorTypeVariables: Record<string, string>,
	unitTypeVariables: Record<string, string>,
	otherTypeVariables: Record<string, string|number>,
	plainSelectors: Record<string, PlainSelectorInterface>,
	macros: Record<string, string>,
	components: Record<string, ComponentsInterface>,
	helpers: Record<string, CallableFunction>,
	screens: Record<string, any>
}

export class CompilerExtension extends preact.Component<ProfilerExtensionPropsInterface, ExpandableStateInterface> {

	public static title = 'Compiler';

	public static icon = `
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
			<path fill="#000" d="M512 384c0-35.328-14.368-67.392-37.504-90.496s-55.168-37.504-90.496-37.504-67.392 14.368-90.496 37.504-37.504 55.168-37.504 90.496 14.368 67.392 37.504 90.496 55.168 37.504 90.496 37.504 67.392-14.368 90.496-37.504 37.504-55.168 37.504-90.496zM448 384c0 17.696-7.136 33.632-18.752 45.248s-27.552 18.752-45.248 18.752-33.632-7.136-45.248-18.752-18.752-27.552-18.752-45.248 7.136-33.632 18.752-45.248 27.552-18.752 45.248-18.752 33.632 7.136 45.248 18.752 18.752 27.552 18.752 45.248zM650.080 492.928c1.472-3.36 3.584-6.112 6.144-8.224 3.584-2.944 8.032-4.672 12.896-4.704h2.88c26.496 0 50.56-10.784 67.872-28.128s28.128-41.376 28.128-67.872-10.784-50.56-28.128-67.872-41.376-28.128-67.872-28.128h-5.088c-3.52-0.032-6.88-0.896-9.856-2.432-4.064-2.112-7.36-5.504-9.344-9.984-0.096-0.928-0.128-1.888-0.128-2.848-0.768-1.76-1.28-3.552-1.568-5.376 0.64-10.688 2.464-14.528 5.376-17.504l1.984-1.984c18.72-18.752 28.096-43.392 28.064-67.904s-9.408-49.152-28.192-67.904c-18.752-18.72-43.392-28.096-67.904-28.064s-49.152 9.408-67.84 28.128l-1.472 1.472c-2.656 2.56-5.856 4.352-9.216 5.312-4.48 1.248-9.312 1.024-14.016-1.056-3.232-1.408-5.984-3.52-8.096-6.080-2.944-3.584-4.672-8.032-4.704-12.896v-2.88c0-26.496-10.784-50.56-28.128-67.872s-41.376-28.128-67.872-28.128-50.56 10.784-67.872 28.128-28.128 41.376-28.128 67.872v5.088c-0.032 3.52-0.896 6.88-2.432 9.856-2.112 4.064-5.504 7.36-9.984 9.344-0.928 0.096-1.888 0.128-2.848 0.128-1.76 0.768-3.552 1.28-5.376 1.568-10.72-0.672-14.56-2.496-17.536-5.408l-1.984-1.984c-18.752-18.72-43.36-28.096-67.904-28.096s-49.12 9.408-67.904 28.224c-18.72 18.752-28.096 43.36-28.096 67.904s9.408 49.152 28.128 67.84l1.536 1.504c2.56 2.656 4.352 5.856 5.312 9.216 1.248 4.48 1.024 9.312-0.992 13.888-0.192 0.512-0.416 1.088-0.672 1.664-1.312 3.488-3.456 6.496-6.112 8.8-3.52 3.040-8 4.896-12.256 4.992h-2.88c-26.496 0-50.56 10.784-67.872 28.128s-28.128 41.408-28.128 67.904 10.784 50.56 28.128 67.872 41.376 28.128 67.872 28.128h5.088c3.52 0.032 6.88 0.896 9.856 2.432 4.096 2.144 7.456 5.568 9.472 10.272 0.768 1.76 1.28 3.552 1.568 5.376-0.64 10.688-2.464 14.528-5.376 17.504l-1.984 1.984c-18.72 18.752-28.096 43.392-28.064 67.904s9.408 49.152 28.192 67.904c18.752 18.72 43.392 28.096 67.904 28.064s49.152-9.408 67.84-28.128l1.504-1.536c2.656-2.56 5.856-4.352 9.216-5.312 4.48-1.248 9.312-1.024 13.888 0.992 0.512 0.192 1.088 0.416 1.664 0.672 3.488 1.312 6.496 3.456 8.8 6.112 3.040 3.52 4.896 8 4.992 12.256v2.944c0 26.496 10.784 50.56 28.128 67.872s41.376 28.128 67.872 28.128 50.56-10.784 67.872-28.128 28.128-41.376 28.128-67.872v-5.088c0.032-3.52 0.896-6.88 2.432-9.856 2.144-4.096 5.568-7.456 10.272-9.472 1.76-0.768 3.552-1.28 5.376-1.568 10.688 0.64 14.528 2.464 17.504 5.376l1.984 1.984c18.752 18.72 43.392 28.096 67.904 28.064s49.152-9.408 67.904-28.192c18.72-18.752 28.096-43.392 28.064-67.904s-9.408-49.152-28.128-67.84l-1.536-1.504c-2.56-2.656-4.352-5.856-5.312-9.216-1.248-4.48-1.024-9.312 0.992-13.888zM588.672 297.664c-0.384-6.432-1.216-9.504-2.432-12.224v2.56c0 1.376 0.096 2.688 0.256 4 0.672 1.92 1.376 3.808 2.176 5.664 0.128 2.88 0.16 2.912 0.16 2.944 7.968 18.592 21.888 32.96 38.656 41.696 11.872 6.176 25.12 9.536 38.752 9.696h5.76c8.832 0 16.8 3.552 22.624 9.376s9.376 13.792 9.376 22.624-3.552 16.8-9.376 22.624-13.792 9.376-22.624 9.376h-2.88c-20.384 0.096-39.040 7.296-53.6 19.296-10.336 8.512-18.592 19.424-24 31.776-8.224 18.624-9.216 38.72-4.064 57.024 3.808 13.536 10.912 26.048 20.864 36.352l2.304 2.336c6.272 6.272 9.408 14.4 9.408 22.624s-3.104 16.384-9.344 22.624c-6.304 6.304-14.432 9.44-22.688 9.44s-16.384-3.104-22.624-9.344l-1.952-1.952c-14.816-14.496-33.28-22.464-52.224-24.064-13.984-1.184-28.224 1.088-41.376 6.784-18.496 7.936-32.864 21.856-41.6 38.592-6.176 11.872-9.536 25.12-9.696 38.752v5.792c0 8.832-3.552 16.8-9.376 22.624s-13.76 9.344-22.592 9.344-16.8-3.552-22.624-9.376-9.376-13.792-9.376-22.624v-2.88c-0.48-21.12-8.16-39.744-20.608-54.144-9.088-10.496-20.672-18.72-33.856-23.808-18.4-7.904-38.176-8.768-56.192-3.712-13.536 3.808-26.048 10.912-36.352 20.864l-2.336 2.304c-6.272 6.272-14.4 9.408-22.624 9.408s-16.384-3.104-22.624-9.344c-6.304-6.304-9.44-14.432-9.44-22.688s3.104-16.384 9.344-22.624l1.952-1.952c14.496-14.816 22.464-33.28 24.064-52.224 1.184-13.984-1.088-28.224-6.784-41.376-7.936-18.496-21.856-32.864-38.592-41.6-11.872-6.176-25.12-9.536-38.752-9.696l-5.76 0.032c-8.832 0-16.8-3.552-22.624-9.376s-9.376-13.792-9.376-22.624 3.552-16.8 9.376-22.624 13.792-9.376 22.624-9.376h2.88c21.12-0.48 39.744-8.16 54.144-20.608 10.496-9.088 18.72-20.672 23.808-33.856 7.904-18.4 8.768-38.176 3.712-56.192-3.808-13.536-10.912-26.048-20.864-36.352l-2.336-2.336c-6.272-6.272-9.408-14.4-9.408-22.624s3.104-16.384 9.344-22.624c6.304-6.304 14.432-9.44 22.688-9.44s16.384 3.104 22.624 9.344l1.952 1.952c14.816 14.496 33.28 22.464 52.224 24.064 11.84 1.024 23.84-0.448 35.232-4.384 3.072-0.384 5.952-1.152 8.512-2.304-0.992 0.032-1.952 0.096-2.848 0.128-6.432 0.384-9.504 1.216-12.224 2.432h2.56c1.376 0 2.688-0.096 4-0.256 1.92-0.672 3.808-1.376 5.664-2.176 2.88-0.128 2.912-0.16 2.944-0.16 18.592-7.968 32.96-21.888 41.696-38.656 6.176-11.84 9.536-25.12 9.696-38.72v-5.792c0-8.832 3.552-16.8 9.376-22.624s13.792-9.376 22.624-9.376 16.8 3.552 22.624 9.376 9.376 13.792 9.376 22.624v2.88c0.096 20.384 7.296 39.040 19.296 53.6 8.512 10.336 19.424 18.592 31.872 24.032 18.496 8.16 38.592 9.152 56.896 4 13.536-3.808 26.048-10.912 36.352-20.864l2.336-2.304c6.272-6.272 14.4-9.408 22.624-9.408s16.384 3.104 22.624 9.344c6.304 6.304 9.44 14.432 9.44 22.688s-3.104 16.384-9.344 22.624l-1.952 1.952c-14.496 14.816-22.464 33.28-24.064 52.224-1.024 11.84 0.448 23.84 4.384 35.232 0.384 3.040 1.184 5.92 2.304 8.512-0.032-1.024-0.064-1.984-0.128-2.848z"></path>
		</svg>
	`;

	constructor() {
		super();

		this.state = {
			...{
				mangleSelectors: false,
				dev: false,
				colorTypeVariables: {},
				unitTypeVariables: {},
				otherTypeVariables: {},
				plainSelectors: {},
				macros: {},
				components: {},
				helpers: {},
				screens: {}
			},
			...this.getConfigurationData()
		};

		window.addEventListener('load', () => {
			this.setState(this.getConfigurationData());
		});
	}

	private getConfigurationData() {
		let variables = {};
		let plainSelectors = {};
		let macros = {};
		let components = {};
		let helpers = {};
		let screens = {};
		const runtime = utils.getStylifyRuntime();

		if (runtime && 'compiler' in runtime) {
			variables = {
				...variables,
				...runtime.compiler.variables
			};
			plainSelectors = {
				...plainSelectors,
				...runtime.compiler.plainSelectors
			};
			macros = {
				...macros,
				...runtime.compiler.macros
			};
			components = {
				...components,
				...runtime.compiler.components
			};
			helpers = {
				...helpers,
				...runtime.compiler.helpers
			};
			screens = {
				...screens,
				...runtime.compiler.screens
			};
		}

		const profilerDataFromPage = utils.getProfilerDataFromPage('compilerExtension');
		if (profilerDataFromPage) {
			variables = {
				...variables,
				...profilerDataFromPage.variables
			};
			plainSelectors = {
				...plainSelectors,
				...profilerDataFromPage.plainSelectors
			};
			macros = {
				...macros,
				...profilerDataFromPage.macros
			};
			components = {
				...components,
				...profilerDataFromPage.components
			};
			helpers = {
				...helpers,
				...profilerDataFromPage.helpers
			};
			screens = {
				...screens,
				...profilerDataFromPage.screens
			};
		}

		const colorTypeVariables = {};
		const unitTypeVariables = {};
		const otherTypeVariables = {};

		for (const variableName in variables) {
			const variableValue = variables[variableName];
			const variableTypeCheckElement = new Option().style;
			variableTypeCheckElement.color = variableValue;
			variableTypeCheckElement.width = variableValue;

			if (variableTypeCheckElement.color !== '') {
				colorTypeVariables[variableName] = variableValue;
				continue;
			}

			if (variableTypeCheckElement.width !== '') {
				unitTypeVariables[variableName] = variableValue;
				continue;
			}

			otherTypeVariables[variableName] = variableValue;
		}

		return {
			colorTypeVariables: colorTypeVariables,
			unitTypeVariables: unitTypeVariables,
			otherTypeVariables: otherTypeVariables,
			plainSelectors: plainSelectors,
			macros: macros,
			components: components,
			helpers: helpers,
			screens: screens
		};
	}

	/* eslint-disable max-len */
	public render(): JSXInternal.Element {
		return (
			<preact.Fragment>
				<Card>
					<CardTitle><span>{`Variables (${Object.keys({...this.state.colorTypeVariables, ...this.state.unitTypeVariables, ...this.state.otherTypeVariables}).length})`}</span></CardTitle>

					<HideableElement visible={Object.keys(this.state.colorTypeVariables).length !== 0}>
						<h3>{`Colors (${Object.keys(this.state.colorTypeVariables).length})`}</h3>
						<TableWrapper>
							<table>
								<thead>
									<tr>
										<th>Name</th>
										<th>Preview</th>
										<th>Value</th>
									</tr>
								</thead>
								<tbody>
									{Object.keys(this.state.colorTypeVariables).sort().map((variableName) => {
										return (
											<tr>
												<td class="white-space:nowrap word-break:break-word width:320px">{variableName}</td>
												<td>
													<div
														class="width:30px height:30px border:1px__solid__#333"
														/* stylify-ignore */
														style={`background-color:${this.state.colorTypeVariables[variableName]}`}
														/* /stylify-ignore */
													></div>
												</td>
												<td class="white-space:nowrap width:calc(100%__-__350px)">{this.state.colorTypeVariables[variableName]}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</TableWrapper>
					</HideableElement>

					<HideableElement visible={Object.keys(this.state.unitTypeVariables).length !== 0}>
						<h3>{`Units (${Object.keys(this.state.unitTypeVariables).length})`}</h3>
						<TableWrapper>
							<table>
								<thead>
									<tr>
										<th>Name</th>
										<th>Value</th>
									</tr>
								</thead>
								<tbody>
									{Object.keys(this.state.unitTypeVariables).sort().map((variableName) => {
										return (
											<tr>
												<td class="white-space:nowrap word-break:break-word width:200px">{variableName}</td>
												<td class="white-space:nowrap width:calc(100%__-__200px)">{this.state.unitTypeVariables[variableName]}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</TableWrapper>
					</HideableElement>

					<HideableElement visible={Object.keys(this.state.otherTypeVariables).length !== 0}>
						<h3>{`Other (${Object.keys(this.state.otherTypeVariables).length})`}</h3>
						<TableWrapper>
							<table>
								<thead>
									<tr>
										<th>Name</th>
										<th>Value</th>
									</tr>
								</thead>
								<tbody>
									{Object.keys(this.state.otherTypeVariables).sort().map((variableName) => {
										return (
											<tr>
												<td class="white-space:nowrap word-break:break-word width:320px">{variableName}</td>
												<td class="white-space:nowrap width:calc(100%__-__320px)">{this.state.otherTypeVariables[variableName]}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</TableWrapper>
					</HideableElement >
					<HideableElement visible={!(Object.keys(this.state.colorTypeVariables).length || Object.keys(this.state.unitTypeVariables).length || Object.keys(this.state.otherTypeVariables).length)}>
						<span>No variables configured.</span>
					</HideableElement>
				</Card>

				<Card>
					<CardTitle><span>{`Screens (${Object.keys(this.state.screens).length})`}</span></CardTitle>
					<TableWrapper visible={Object.keys(this.state.screens).length !== 0}>
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Value</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.screens).map((screenName) => {
									return (
										<tr>
											<td class="white-space:nowrap word-break:break-word width:320px">{screenName}</td>
											<td class="white-space:nowrap width:calc(100%__-__320px)">
												{typeof this.state.screens[screenName] === 'function' ? this.state.screens[screenName].toString() : this.state.screens[screenName]}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</TableWrapper>
					<HideableElement visible={Object.keys(this.state.screens).length === 0}>
						<span>No screens defined.</span>
					</HideableElement>
				</Card>

				<Card>
					<CardTitle><span>{`Selectors macros (${Object.keys(this.state.macros).length})`}</span></CardTitle>
					<div class="max-width:100%">
						{Object.keys(this.state.macros).sort().map((macroRegExp) => {
							return (
								<pre class="margin-bottom:12px">
									{macroRegExp}{this.state.macros[macroRegExp].toString().replaceAll(/ {2}|\t\t/ig, ' ')}
								</pre>
							);
						})}
					</div>
					<HideableElement visible={Object.keys(this.state.macros).length === 0}>
						<span>No selectors macros configured.</span>
					</HideableElement>
				</Card>

				<Card>
					<CardTitle><span>{`Plain selectors (${Object.keys(this.state.plainSelectors).length})`}</span></CardTitle>
					<TableWrapper visible={Object.keys(this.state.plainSelectors).length !== 0}>
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Selectors dependencies</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.plainSelectors).sort().map((plainSelector) => {
									return (
										<tr>
											<td class="white-space:nowrap word-break:break-word width:320px">{plainSelector}</td>
											<td class="white-space:nowrap word-spacing:12px width:calc(100%__-__320px)">{this.state.plainSelectors[plainSelector].selectors.join(' ')}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</TableWrapper>
					<HideableElement visible={Object.keys(this.state.plainSelectors).length === 0}>
						<span>No plain selectors configured.</span>
					</HideableElement>
				</Card>

				<Card>
					<CardTitle><span>{`Components (${Object.keys(this.state.components).length})`}</span></CardTitle>
					<TableWrapper visible={Object.keys(this.state.components).length !== 0}>
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Selectors dependencies</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.components).sort().map((componentName) => {
									return (
										<tr>
											<td class="white-space:nowrap word-break:break-word width:320px">{componentName}</td>
											<td class="white-space:nowrap word-spacing:12px width:calc(100%__-__320px)">{this.state.components[componentName].selectors.join(' ')}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</TableWrapper>
					<HideableElement visible={Object.keys(this.state.components).length === 0}>
						<span>No components configured.</span>
					</HideableElement>
				</Card>

				<Card>
					<CardTitle><span>{`Helpers (${Object.keys(this.state.helpers).length})`}</span></CardTitle>
					<TableWrapper visible={Object.keys(this.state.helpers).length !== 0}>
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Callback</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(this.state.helpers).sort().map((helperName) => {
									return (
										<tr>
											<td class="word-break:break-word width:320px">{helperName}</td>
											<td class="white-space:nowrap width:calc(100%__-__320px)">
												<pre>{this.state.helpers[helperName].toString().replaceAll(/ {2}|\t\t/ig, ' ')}</pre>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</TableWrapper>
					<HideableElement visible={Object.keys(this.state.helpers).length === 0}>
						<span>No helpers configured.</span>
					</HideableElement>
				</Card>
			</preact.Fragment>
		);
	}

}
