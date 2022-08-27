import {
	CompilationResult,
	MacroMatch,
	SelectorProperties,
	SelectorsComponentsMapType,
	minifiedSelectorGenerator,
	screensSorter,
	ScreensToSortMapType
} from '.';

export type MacroCallbackType = (macroMatch: MacroMatch, selectorProperties: SelectorProperties) => void;

export type ScreenCallbackType = (screen: string) => string;

export type ComponentSelectorsType = string|string[];

export interface PlainSelectorInterface {
	selectors: string[]
}

export interface ComponentConfigInterface {
	selectors: ComponentSelectorsType
	selectorsChain: string|string[],
}

export interface CompilerContentOptionsInterface {
	pregenerate: PregenerateType,
	components: ComponentsType,
	variables: VariablesType,
	keyframes: KeyframesType,
	plainSelectors: PlainSelectorsType
	screens: ScreensType
}

export type OnPrepareCompilationResultCallbackType = (compilationResult: CompilationResult) => void;

export type ContentOptionsProcessorCallbackType = (
	contentOptions: Partial<CompilerContentOptionsInterface>,
	optionMatchValue: string
	) => Partial<CompilerContentOptionsInterface>;

export type ContentOptionsProcessorsType = Record<string, ContentOptionsProcessorCallbackType>;

export type ComponentsType = Record<string, ComponentsInterface>;

export type MacrosType = Record<string, MacroCallbackType>;

export type HelpersType = Record<string, CallableFunction>;

export type ScreensType = Record<string, string|ScreenCallbackType>;

type VariablesTypeValue = string|number;

export type VariablesType = Record<string, VariablesTypeValue|Record<string, VariablesTypeValue>>;

export type KeyframesType = Record<string, string>;

export type PlainSelectorsType = Record<string, string>;

export type PregenerateType = string[]|string;

export interface CompilerConfigInterface {
	dev?: boolean,
	macros?: MacrosType,
	helpers?: HelpersType,
	variables?: VariablesType,
	keyframes?: KeyframesType,
	screens?: ScreensType,
	plainSelectors?: PlainSelectorsType,
	mangleSelectors?: boolean,
	pregenerate?: PregenerateType,
	components?: Record<string, ComponentSelectorsType|ComponentConfigInterface>,
	onPrepareCompilationResult?: OnPrepareCompilationResultCallbackType,
	onNewMacroMatch?: OnNewMacroMatchCallbackType,
	contentOptionsProcessors?: ContentOptionsProcessorsType,
	ignoredAreas?: RegExp[],
	selectorsAreas?: string[],
	replaceVariablesByCssVariables?: boolean,
	injectVariablesIntoCss?: boolean
}

export type OnNewMacroMatchCallbackType = MacroCallbackType;

export interface ComponentsInterface {
	selectors: string[],
	selectorsChain: string[],
	mangledSelector: string
}

export class Compiler {

	private readonly contentOptionsRegExp = /stylify-([a-zA-Z-_0-9]+)\s([\s\S]+?)\s\/stylify-[a-zA-Z-_0-9]+/;

	private ignoredAreasRegExpString: string = null;

	public ignoredAreas = [
		/stylify-ignore([\s\S]*?)\/stylify-ignore/,
		/<code[\s]*?>([\s\S]*?)<\/code>/,
		/<head[\s]*?>([\s\S]*?)<\/head>/,
		/<pre[\s]*?>([\s\S]*?)<\/pre>/,
		/<script[\s]*?>([\s\S]*?)<\/script>/,
		/<style[\s]*?>([\s\S]*?)<\/style>/
	];

	public contentOptionsProcessors: ContentOptionsProcessorsType = {};

	public onPrepareCompilationResult: OnPrepareCompilationResultCallbackType = null;

	public onNewMacroMatch: OnNewMacroMatchCallbackType = null;

	public mangleSelectors = false;

	public dev = false;

	public macros: MacrosType = {};

	public helpers: HelpersType = {};

	public screens: ScreensType = {};

	public variables: VariablesType = {};

	public keyframes: KeyframesType = {};

	public components: ComponentsType = {};

	public pregenerate = '';

	public selectorsAreas = ['(?:^|\\s+)class="([^"]+)"', '(?:^|\\s+)class=\'([^\']+)\''];

	public plainSelectors: PlainSelectorsType = {};

	public replaceVariablesByCssVariables = false;

	public injectVariablesIntoCss = true;

	constructor(config: CompilerConfigInterface = {}) {
		if (!Object.keys(config).length) {
			return;
		}

		this.configure(config);
	}

	public configure(config: CompilerConfigInterface): Compiler {
		this.dev = config.dev ?? this.dev;
		this.macros = Object.assign(this.macros, config.macros || {});

		this.helpers = Object.assign(this.helpers, config.helpers || {});
		this.variables = Object.assign(this.variables, config.variables || {});
		this.keyframes = Object.assign(this.keyframes, config.keyframes || {});
		this.screens = Object.assign(this.screens, config.screens || {});
		this.mangleSelectors = config.mangleSelectors ?? this.mangleSelectors;

		if (typeof config.pregenerate !== 'undefined') {
			this.pregenerate += Array.isArray(config.pregenerate) ? config.pregenerate.join(' ') : config.pregenerate;
		}

		this.contentOptionsProcessors = {...this.contentOptionsProcessors, ...config.contentOptionsProcessors};
		const ignoredAreasRegExpStrings: string[] = [];
		this.ignoredAreas = [...this.ignoredAreas, ...config.ignoredAreas || []]
			.filter((ignoredAreaRegExp, index, self) => {
				const isUnique = self.indexOf(ignoredAreaRegExp) === index;
				if (isUnique) ignoredAreasRegExpStrings.push(ignoredAreaRegExp.source);
				return isUnique;
			});
		this.ignoredAreasRegExpString = ignoredAreasRegExpStrings.join('|');

		this.replaceVariablesByCssVariables = 'replaceVariablesByCssVariables' in config
			? config.replaceVariablesByCssVariables
			: this.replaceVariablesByCssVariables;
		this.injectVariablesIntoCss = 'injectVariablesIntoCss' in config
			? config.injectVariablesIntoCss
			: this.injectVariablesIntoCss;
		this.selectorsAreas = [...this.selectorsAreas, ...config.selectorsAreas || []];
		this.onPrepareCompilationResult = config.onPrepareCompilationResult || this.onPrepareCompilationResult;
		this.onNewMacroMatch = config.onNewMacroMatch || this.onNewMacroMatch;

		const plainSelectors = config.plainSelectors || {};
		for (const [plainSelector, dependencySelectors] of Object.entries(plainSelectors)) {
			this.addPlainSelector(plainSelector, dependencySelectors);
		}

		const components = config.components || {};
		for (const componentSelector in components) {
			this.addComponent(componentSelector, components[componentSelector]);
		}

		return this;
	}

	public addPlainSelector(selector: string, dependencySelectors: string): void {
		const selectorsArray = selector.split(', ');

		for (const selector of selectorsArray) {
			const filteredSelectors = this.convertStringOrStringArrayToFilteredArray(
				this.plainSelectors[selector] ?? '',
				...dependencySelectors.replace(/\s/ig, ' ').split(' ').map(selector => selector.trim())
			);

			this.plainSelectors[selector] = filteredSelectors.join(' ');
		}
	}

	public addComponent(
		selector: string,
		config: ComponentSelectorsType|ComponentConfigInterface
	): Compiler {
		if (selector.includes(',')) {
			selector.split(',').forEach((selector) => {
				this.addComponent(selector.trim(), config);
			});
			return;
		}

		const componentAlreadyDefined = selector in this.components;

		if (componentAlreadyDefined && this.dev) {
			const info = `You are configuring component "${selector}" that has already been configured.`;
			console.warn(info);
		}

		const configIsArray = Array.isArray(config);
		const componentConfig = typeof config === 'string' || configIsArray
			? {
				selectors: this.convertStringOrStringArrayToFilteredArray([
					...componentAlreadyDefined ? this.components[selector].selectors : [],
					...(configIsArray ? config: [config]).map(selector => selector.replace(/\s/ig, ' ').trim())
				]),
				selectorsChain: componentAlreadyDefined ? this.components[selector].selectorsChain : []
			}
			: config;

		this.components[selector] = {
			selectors: this.convertStringOrStringArrayToFilteredArray([
				...Array.isArray(componentConfig.selectors) ? componentConfig.selectors : [componentConfig.selectors],
				...componentAlreadyDefined ? this.components[selector].selectors : []
			]),
			selectorsChain: Array.isArray(componentConfig.selectorsChain)
				? componentConfig.selectorsChain
				: [componentConfig.selectorsChain],
			mangledSelector: minifiedSelectorGenerator.getSelector(selector)
		};

		return this;
	}

	private convertStringOrStringArrayToFilteredArray(...args: string[]|[string[]]): string[] {
		let filteredArray: string[] = [];

		for (const arg of args) {
			filteredArray = [
				...filteredArray,
				...(Array.isArray(arg) ? arg.join(' ').split(' ') : arg.split(' ')).filter(
					(filterItem) => filterItem.length && !filteredArray.includes(filterItem)
				)
			];
		}

		return filteredArray;
	}

	public addMacro(re: string, callback: MacroCallbackType): Compiler {
		this.macros[re] = callback;
		return this;
	}

	public rewriteSelectors(content: string, compilationResult: CompilationResult, rewriteOnlyInAreas = true): string {
		if (this.dev && !this.mangleSelectors) {
			return content;
		}

		const placeholderTextPart = '__STYLIFY_PLACEHOLDER__';
		const contentPlaceholders: Record<string, string> = {};

		const placeholderInserter = (matched: string) => {
			const placeholderKey = `${placeholderTextPart}${Object.keys(contentPlaceholders).length}`;
			contentPlaceholders[placeholderKey] = matched;
			return placeholderKey;
		};

		content = content
			.replace(new RegExp(this.ignoredAreasRegExpString, 'g'), (...args): string => {
				const matchArguments = args.filter((value) => typeof value === 'string');
				const fullMatch: string = matchArguments[0];
				const innerHtml: string = matchArguments[1];
				return typeof innerHtml === 'undefined' || innerHtml.length === 0
					? fullMatch
					: fullMatch.replace(innerHtml, placeholderInserter(innerHtml));
			})
			.replace(new RegExp(this.contentOptionsRegExp.source, 'g'), (matched: string) => {
				return placeholderInserter(matched);
			});

		const selectorsListKeys = Object.keys(compilationResult.selectorsList);
		const sortedSelectorsListKeys = [...selectorsListKeys, ...compilationResult.componentsList]
			.sort((a: string, b: string): number => {
				return b.length - a.length;
			});

		for (let selector of sortedSelectorsListKeys) {
			const selectorIsSelector = selectorsListKeys.includes(selector);
			const selectorIsComponent = selector in this.components;

			if (!content.includes(selector) || !(selectorIsSelector || selectorIsComponent)) {
				continue;
			}

			const mangledSelector = selectorIsSelector
				? compilationResult.selectorsList[selector].mangledSelector
				: this.components[selector].mangledSelector;

			selector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

			if (!rewriteOnlyInAreas) {
				content = content.replace(new RegExp(selector, 'g'), mangledSelector);
				continue;
			}

			for (const rewriteSelectorAreaRegExpString of this.selectorsAreas) {
				const regExp = new RegExp(rewriteSelectorAreaRegExpString, 'g');
				content = content.replace(regExp, (fullMatch: string, selectorMatch: string): string => {
					const selectorReplacement = selectorMatch.replace(new RegExp(selector, 'g'), mangledSelector);
					return fullMatch.replace(selectorMatch, selectorReplacement);
				});
			}
		}

		for (const placeholderKey in contentPlaceholders) {
			content = content.replace(placeholderKey, contentPlaceholders[placeholderKey]);
		}

		return content;
	}

	public compile(
		content: string,
		compilationResult: CompilationResult = null,
		matchOnlyInAreas = true
	): CompilationResult {
		let contentToProcess = '';

		content = content
			.replace(new RegExp(this.ignoredAreasRegExpString, 'g'), (...args): string => {
				const matchArguments = args.filter((value) => typeof value === 'string');
				const fullMatch: string = matchArguments[0];
				const innerHtml: string = matchArguments[1];

				return typeof innerHtml === 'undefined' || innerHtml.length === 0
					? fullMatch
					: fullMatch.replace(innerHtml, '');
			})
			.replace(/&amp;/ig, '&');

		content = this.dev ? content.replace(/\r\n/, '\n') : content.replace(/\r\n|\r|\n|\t/ig, ' ');

		this.configure(this.getOptionsFromContent(content));
		compilationResult = this.prepareCompilationResult(compilationResult);

		content = content.replace(new RegExp(this.contentOptionsRegExp.source, 'g'), '');

		if (matchOnlyInAreas) {
			for (const selectorAreaRegExpString of this.selectorsAreas) {
				const regExp = new RegExp(selectorAreaRegExpString, 'g');
				let selectorAreasMatches: RegExpExecArray;
				while ((selectorAreasMatches = regExp.exec(content))) {
					contentToProcess += ' ' + selectorAreasMatches[1];
				}
			}

		} else {
			contentToProcess = content;
		}

		const plainSelectorsSelectorsMap = {};
		for (const plainSelector in this.plainSelectors) {
			const plainSelectorData = this.plainSelectors[plainSelector];
			plainSelectorsSelectorsMap[plainSelector] = plainSelectorData;
			this.pregenerate += `  ${plainSelectorData}`;
		}

		contentToProcess = `${this.pregenerate} ${contentToProcess}`;
		this.pregenerate = '';

		if (compilationResult && Object.keys(compilationResult.selectorsList).length) {
			contentToProcess = contentToProcess.replace(/_\w+/ig, (matched) => {
				return matched in compilationResult.selectorsList
					? minifiedSelectorGenerator.getSelector(matched)
					: matched;
			});
		}

		const selectorsComponentsMap: SelectorsComponentsMapType = {};

		Object.keys(this.components).forEach((componentsSelector) => {
			if (!contentToProcess.match(new RegExp(`${componentsSelector}`, 'g'))) {
				return;
			}

			const { selectors, selectorsChain } = this.components[componentsSelector];
			contentToProcess += ` ${selectors.join(' ')}`;

			selectors.forEach((componentDependencySelector: string): void => {
				if (! (componentDependencySelector in selectorsComponentsMap)) {
					selectorsComponentsMap[componentDependencySelector] = [];
				}

				selectorsComponentsMap[componentDependencySelector].push({
					component: componentsSelector,
					selectorsChain: selectorsChain
				});
			});
		});

		this.processMacros(contentToProcess, compilationResult);

		compilationResult.bindPlainSelectorsToSelectors(plainSelectorsSelectorsMap);
		compilationResult.bindComponentsToSelectors(selectorsComponentsMap);

		return compilationResult;
	}

	private prepareCompilationResult(compilationResult: CompilationResult = null): CompilationResult
	{
		if (!compilationResult) {
			compilationResult = new CompilationResult();
		}

		const newLine = this.dev ? '\n' : '';
		const makeVariableString = (variable: string, value: VariablesTypeValue) => `--${variable}: ${String(value)};${newLine}`;
		let variablesCss = '';

		if (this.injectVariablesIntoCss) {
			let variablesCssMap: ScreensToSortMapType = new Map();
			variablesCssMap.set('_', '');

			let screensString = '';
			const addScreenVariable = (screen: string, variable: string, value) => variablesCssMap.set(
				screen, `${variablesCssMap.get(screen) as string}${makeVariableString(variable, String(value))}`

			);
			for (const [variableOrScreen, value] of Object.entries(this.variables)) {
				if (['string', 'number'].includes(typeof value)) {
					addScreenVariable('_', variableOrScreen, value);
					continue;
				}

				if (!(variableOrScreen in variablesCssMap)) {
					variablesCssMap.set(variableOrScreen, '');
					screensString += ` ${variableOrScreen}`;
				}

				for (const [screenVariableName, screenVariableValue] of Object.entries(value)) {
					addScreenVariable(variableOrScreen, screenVariableName, screenVariableValue);
				}
			}

			for (const key in this.screens) {
				const screenRegExp = new RegExp(`\\b${key}`, 'g');
				let screenMatches: RegExpExecArray;

				while ((screenMatches = screenRegExp.exec(screensString))) {
					if (screenMatches === null) {
						continue;
					}

					let screenData = this.screens[key];

					if (typeof screenData === 'function') {
						screenData = screenData(screenMatches[0]);
					}

					variablesCssMap.set(`@media ${screenData}`, variablesCssMap.get(screenMatches[0]));
					variablesCssMap.set(screenMatches[0], '');
				}
			}

			variablesCssMap = screensSorter.sortCssTreeMediaQueries(variablesCssMap);

			for (const screen of variablesCssMap.keys()) {
				const screenVariablesString = variablesCssMap.get(screen);

				if (!screenVariablesString.length) {
					continue;
				}

				const rootCss = `:root {${newLine}${screenVariablesString as string}}${newLine}`;
				variablesCss += screen === '_' ? rootCss : `${screen} {${newLine}${rootCss}}${newLine}`;
			}
		}

		let keyframesCss = '';

		for (const [keyframe, keyframeCode] of Object.entries(this.keyframes)) {
			keyframesCss += `@keyframes ${keyframe} {${keyframeCode.trimEnd()}${newLine}}${newLine}`;
		}

		compilationResult.configure({
			dev: this.dev,
			mangleSelectors: this.mangleSelectors,
			defaultCss: `${[variablesCss, keyframesCss].join(newLine).trim()}${newLine}`
		});

		if (this.onPrepareCompilationResult) {
			this.onPrepareCompilationResult(compilationResult);
		}

		return compilationResult;
	}

	private processMacros(content: string, compilationResult: CompilationResult = null) {
		const regExpEndPart = `(?=['"\`{}\\[\\]<>\\s]|$)`;
		const regExpGenerators = [
			// Match with media query and without pseudo class
			(macroKey: string): RegExp => new RegExp(`(?:([a-zA-Z0-9-:&|]+):)${macroKey}${regExpEndPart}`, 'g'),
			// Match without media query and without pseudo class
			// () - empty pseudo class and media query match
			(macroKey: string): RegExp => new RegExp(`()${macroKey}${regExpEndPart}`, 'g')
		];

		for (const regExpGenerator of regExpGenerators) {
			for (const macroKey in this.macros) {

				content = content.replace(regExpGenerator(macroKey), (...args) => {
					const macroMatches: string[] = args.slice(0, args.length - 2);
					const macroMatch = new MacroMatch(macroMatches, this.screens);

					if (macroMatch.fullMatch in compilationResult.selectorsList) {
						compilationResult.selectorsList[macroMatch.fullMatch].shouldBeGenerated = true;
						return '';
					}

					const selectorProperties = new SelectorProperties();

					this.macros[macroKey].call(
						{
							dev: this.dev,
							variables: this.variables,
							helpers: this.helpers
						},
						macroMatch,
						selectorProperties
					);

					for (const property in selectorProperties.properties) {
						selectorProperties.properties[property] = selectorProperties.properties[property].replace(
							/\$([\w-_]+)/g,
							(match, substring: string): string => {
								if (!(substring in this.variables)) {
									const info = `Stylify: Variable "${substring}" not found when processing "${macroMatch.fullMatch}". Available variables are "${Object.keys(this.variables).join(', ')}".`;
									if (this.dev) {
										console.warn(info);
									} else {
										throw new Error(info);
									}
								}
								return this.replaceVariablesByCssVariables
									? `var(--${substring})`
									: String(this.variables[substring]);
							}
						);
					}

					if (this.onNewMacroMatch) {
						this.onNewMacroMatch.call(
							{
								dev: this.dev,
								variables: this.variables,
								helpers: this.helpers
							},
							macroMatch,
							selectorProperties
						);
					}

					compilationResult.addCssRecord(macroMatch, selectorProperties);

					return '';
				});
			}
		}
	}

	public getOptionsFromContent(content: string): CompilerContentOptionsInterface {
		let contentOptions: CompilerContentOptionsInterface = {
			pregenerate: '',
			components: {},
			plainSelectors: {},
			screens: {},
			variables: {},
			keyframes: {}
		};

		const regExp = new RegExp(this.contentOptionsRegExp.source, 'g');
		let optionMatch: RegExpExecArray;

		while ((optionMatch = regExp.exec(content))) {
			if (![typeof optionMatch[1], typeof optionMatch[2]].includes('string')) {
				continue;
			}

			const optionKey = optionMatch[1];
			const optionMatchValue = this.dev ? optionMatch[2] : optionMatch[2].replace(/\n|\t/g, ' ');

			try {
				if (optionKey === 'pregenerate') {
					contentOptions[optionKey] += ` ${optionMatchValue}`;

				} else if (['components', 'variables', 'keyframes', 'plainSelectors', 'screens'].includes(optionKey)) {
					contentOptions[optionKey] = {
						...contentOptions[optionKey],
						// eslint-disable-next-line @typescript-eslint/no-implied-eval
						...new Function(`return {${optionMatchValue.trim()}}`)()
					};
				} else if (optionKey in this.contentOptionsProcessors) {
					contentOptions = {
						...contentOptions,
						...this.contentOptionsProcessors[optionKey](contentOptions, optionMatchValue)
					};
				}

			} catch (error) {
				if (this.dev) {
					console.error(
						`Error "${error as string}" occurred when processing "${optionKey}" and its value "${optionMatchValue}".`
					);
				}
			}
		}

		return contentOptions;
	}

}
