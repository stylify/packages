import {
	CompilationResult,
	MacroMatch,
	SelectorProperties,
	minifiedSelectorGenerator,
	screensSorter,
	ScreensToSortMapType,
	defaultPreset,
	CustomSelector
} from '.';

import { hooks } from '../Hooks';

export interface CompilerContentOptionsInterface {
	pregenerate: PregenerateType,
	components: ComponentsType,
	variables: VariablesType,
	keyframes: KeyframesType,
	customSelectors: CustomSelectorType
	screens: ScreensType
}

export interface CompilerHooksListInterface {
	'compiler:beforeMacrosProcessed': CompilationResult,
	'compiler:afterMacrosProcessed': CompilationResult,
	'compiler:compilationResultConfigured': CompilationResult,
	'compiler:newMacroMatch': {
		dev: boolean,
		macroMatch: MacroMatch,
		selectorProperties: SelectorProperties,
		variables: VariablesType,
		helpers: HelpersType
	},
	[key: `compiler:processContentOption:${string}`]: {
		contentOptions: Record<string, any>,
		key: string,
		value: string
	}
}

export type MacroCallbackType = (macroMatch: MacroMatch, selectorProperties: SelectorProperties) => void;

export type ScreenCallbackType = (screen: string) => string;

export interface CustomSelectorInterface {
	selectors: string[]
}

export type OnPrepareCompilationResultCallbackType = (compilationResult: CompilationResult) => void;

export type ComponentsType = Record<string, ComponentsInterface>;

export type MacrosType = Record<string, MacroCallbackType>;

export type HelpersType = Record<string, CallableFunction>;

export type ScreensType = Record<string, string|ScreenCallbackType>;

type VariablesTypeValue = string;

export type VariablesType = Record<string, VariablesTypeValue|Record<string, string>>;

export type KeyframesType = Record<string, string>;

export type CustomSelectorType = Record<string, string>;

export type PregenerateType = string[]|string;

export interface CompilerConfigInterface {
	dev?: boolean,
	macros?: MacrosType,
	helpers?: HelpersType,
	variables?: VariablesType,
	keyframes?: KeyframesType,
	screens?: ScreensType,
	customSelectors?: CustomSelectorType,
	mangleSelectors?: boolean,
	pregenerate?: PregenerateType,
	components?: Record<string, string>,
	ignoredAreas?: RegExp[],
	selectorsAreas?: string[],
	replaceVariablesByCssVariables?: boolean,
	injectVariablesIntoCss?: boolean
	matchCustomSelectors?: boolean
}

export interface CustomSelectorsInterface {
	customSelectors: CustomSelector[]
}

export type OnNewMacroMatchCallbackType = MacroCallbackType;

export interface ComponentsInterface {
	customSelectors: CustomSelector[],
}

export class Compiler {

	private readonly textPlaceholder = '_TEXT_';

	private readonly dollarPlaceholder = '_DOLLAR_';

	private readonly variableRegExp = /\$([\w-_]+)/;

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

	public customSelectors: Record<string, CustomSelectorsInterface> = {};

	private matchCustomSelectors = true;

	public replaceVariablesByCssVariables = false;

	public injectVariablesIntoCss = true;

	private processedHelpers = {};

	constructor(config: CompilerConfigInterface = {}) {
		this.configure(defaultPreset);

		if (!Object.keys(config).length) {
			return;
		}

		this.configure(config);
	}

	public configure(config: CompilerConfigInterface): Compiler {
		this.dev = config.dev ?? this.dev;
		this.matchCustomSelectors = config.matchCustomSelectors ?? this.matchCustomSelectors;
		this.macros = {...this.macros, ...config.macros ?? {}};
		this.helpers = {...this.helpers, ...config.helpers ?? {}};
		this.keyframes = {...this.keyframes, ...config.keyframes ?? {}};
		this.screens = {...this.screens, ...config.screens ?? {}};
		this.injectVariablesIntoCss = config.injectVariablesIntoCss ?? this.injectVariablesIntoCss;
		this.selectorsAreas = [...this.selectorsAreas, ...config.selectorsAreas ?? []];
		this.mangleSelectors = config.mangleSelectors ?? this.mangleSelectors;
		this.replaceVariablesByCssVariables =
			config.replaceVariablesByCssVariables ?? this.replaceVariablesByCssVariables;
		this.addVariables(config.variables ?? {});

		if (typeof config.pregenerate !== 'undefined') {
			this.pregenerate += Array.isArray(config.pregenerate) ? config.pregenerate.join(' ') : config.pregenerate;
		}

		const ignoredAreasRegExpStrings: string[] = [];
		this.ignoredAreas = [...this.ignoredAreas, ...config.ignoredAreas ?? []]
			.filter((ignoredAreaRegExp, index, self) => {
				const isUnique = self.indexOf(ignoredAreaRegExp) === index;
				if (isUnique) ignoredAreasRegExpStrings.push(ignoredAreaRegExp.source);
				return isUnique;
			});
		this.ignoredAreasRegExpString = ignoredAreasRegExpStrings.join('|');

		for (const [selector, selectorsToGenerate] of Object.entries(config.customSelectors ?? {})) {
			this.addCustomSelector(selector, selectorsToGenerate);
		}

		for (const [componentSelector, componentString] of Object.entries(config.components ?? {})) {
			this.addComponent(componentSelector, componentString);
		}

		return this;
	}

	public addVariables(variables: VariablesType, screen: string = null): void {
		for (const [variableOrScreen, valueOrVariables] of Object.entries(variables)) {
			if (!['string', 'number'].includes(typeof valueOrVariables)) {
				this.addVariables(valueOrVariables as VariablesType, variableOrScreen);
				continue;
			}

			const processedValue = this.replaceVariableString(this.processHelpers(String(valueOrVariables), false));

			if (screen) {
				if (!(screen in this.variables)) {
					this.variables[screen] = {};
				}

				this.variables[screen][variableOrScreen] = processedValue;
				continue;
			}

			this.variables[variableOrScreen] = processedValue;
		}
	}

	public addCustomSelector(selector: string, selectors: string, selectorCanBeSplit = true): void {
		if (selectorCanBeSplit && selector.includes(',')) {
			selector.split(',').forEach((selectorSplit) => this.addCustomSelector(selectorSplit.trim(), selectors));
			return;
		}

		if (!(selector in this.customSelectors)) {
			this.customSelectors[selector] = {
				customSelectors: []
			};
		}

		this.customSelectors[selector].customSelectors.push(new CustomSelector(selectors));
	}

	public addComponent(selector: string, selectors: string): Compiler {
		if (selector.includes(',')) {
			selector.split(',').forEach((selector) => this.addComponent(selector.trim(), selectors));
			return;
		}

		if (!(selector in this.components)) {
			this.components[selector] = {
				customSelectors: []
			};
		}

		this.components[selector].customSelectors.push(new CustomSelector(selectors));

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

	public rewriteSelectors(options: {
		content: string,
		rewriteOnlyInAreas?: boolean
		matchSelectorsWithPrefixes?: boolean
	}|string): string {
		let rewriteOnlyInAreas = true;
		let matchSelectorsWithPrefixes = false;
		let content = '';

		if (typeof options === 'string') {
			content = options;
		} else {
			content = options.content;
			rewriteOnlyInAreas = options.rewriteOnlyInAreas ?? rewriteOnlyInAreas;
			matchSelectorsWithPrefixes = options.matchSelectorsWithPrefixes ?? matchSelectorsWithPrefixes;
		}

		if (this.dev && !this.mangleSelectors) {
			return content;
		}

		const dollarPlaceholderRegExp = new RegExp(this.dollarPlaceholder, 'g');
		const placeholderTextPart = this.textPlaceholder;
		const contentPlaceholders: Record<string, string> = {};

		const placeholderInserter = (matched: string) => {
			const placeholderKey = `${placeholderTextPart}${Object.keys(contentPlaceholders).length}`;
			contentPlaceholders[placeholderKey] = matched.replace(/\$/g, this.dollarPlaceholder);
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

		const selectorsListKeys = Object.keys(minifiedSelectorGenerator.processedSelectors)
			.sort((a: string, b: string): number => b.length - a.length);

		for (let selector of selectorsListKeys) {
			if (!content.includes(selector)) {
				continue;
			}

			const mangledSelector = minifiedSelectorGenerator.getMangledSelector(selector);
			const selectorPrefix = matchSelectorsWithPrefixes
				? minifiedSelectorGenerator.getSelectorPrefix(selector)
				: '';
			selector = this.escapeCssSelector(
				minifiedSelectorGenerator.getStringToMatch(selector, matchSelectorsWithPrefixes)
			);

			const replacement = `${selectorPrefix}${mangledSelector}`;

			if (rewriteOnlyInAreas === false) {
				content = content.replace(new RegExp(selector, 'g'), replacement);
				continue;
			}

			for (const rewriteSelectorAreaRegExpString of this.selectorsAreas) {
				const regExp = new RegExp(rewriteSelectorAreaRegExpString, 'g');
				content = content.replace(regExp, (fullMatch: string, selectorMatch: string): string => {
					const selectorReplacement = selectorMatch.replace(new RegExp(selector, 'g'), replacement);
					return fullMatch.replace(selectorMatch, selectorReplacement);
				});
			}
		}

		for (const [placeholderKey, contentPlaceholder] of Object.entries(contentPlaceholders)) {
			content = content.replace(placeholderKey, contentPlaceholder.replace(dollarPlaceholderRegExp, '$$$$'));
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

		this.configure(this.processOptionsFromContent(this.getOptionsFromContent(content)));
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

		contentToProcess = `${this.pregenerate} ${contentToProcess}`;
		this.pregenerate = '';

		if (this.matchCustomSelectors) {
			contentToProcess = contentToProcess.replace(
				/\[([^{}\s]+)\]{([^{}]+)}/g,
				(fullMatch: string, selector: string, selectors: string) => {
					const customSelector = MacroMatch.replaceCharactersAliases(selector);
					const customSelectorSelector = this.mangleSelectors
						? minifiedSelectorGenerator.getMangledSelector(fullMatch, null)
						: fullMatch;

					this.addCustomSelector(
						`.${this.escapeCssSelector(customSelectorSelector, true)}`,
						`${customSelector}{${selectors.replace(/;/g, ' ')}}`,
						false
					);
					return '';
				}
			);
		}

		this.processComponents(contentToProcess);

		const customSelectorsSelectorsMap: Record<string, string> = this.processCustomSelectors();

		contentToProcess += ` ${Object.values(customSelectorsSelectorsMap).join(' ')}`;

		compilationResult = compilationResult ?? new CompilationResult();

		hooks.callHook('compiler:beforeMacrosProcessed', compilationResult);

		this.processMacros(contentToProcess, compilationResult);

		hooks.callHook('compiler:afterMacrosProcessed', compilationResult);

		this.configureCompilationResult(compilationResult);

		compilationResult.bindCustomSelectorsToSelectors(customSelectorsSelectorsMap);

		return compilationResult;
	}

	public getOptionsFromContent<
		ContentOptions extends CompilerContentOptionsInterface,
		Keys extends keyof ContentOptions = keyof ContentOptions,
		Data = Record<Keys, string[]>
	>(content: string): Data {
		const contentOptions = {};

		const regExp = new RegExp(this.contentOptionsRegExp.source, 'g');
		let optionMatch: RegExpExecArray;

		while ((optionMatch = regExp.exec(content))) {
			if (![typeof optionMatch[1], typeof optionMatch[2]].includes('string')) {
				continue;
			}

			const option = optionMatch[1];
			const optionValue = this.dev ? optionMatch[2] : optionMatch[2].replace(/\n|\t/g, ' ');

			if (!(option in contentOptions)) {
				contentOptions[option] = [];
			}

			contentOptions[option].push(optionValue);
		}

		return contentOptions as Data;
	}

	private escapeCssSelector(selector: string, all = false): string {
		return selector.replace(all ? /[^a-zA-Z0-9]/g : /[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private configureCompilationResult(compilationResult: CompilationResult): CompilationResult
	{
		const newLine = this.dev ? '\n' : '';
		const makeVariableString = (variable: string, value: VariablesTypeValue) => `--${variable}: ${String(value)};${newLine}`;
		let variablesCss = '';

		if (this.injectVariablesIntoCss) {
			let rootCss = '';
			let screensString = '';

			for (const [variableOrScreen, value] of Object.entries(this.variables)) {
				if (['string', 'number'].includes(typeof value)) {
					rootCss += makeVariableString(variableOrScreen, String(value));
					continue;
				}

				const newScreenStringPart = MacroMatch.replaceCharactersAliases(variableOrScreen, 'space');
				if (!new RegExp(`(?:\\s|^)${newScreenStringPart}`).test(screensString)) {
					screensString += ` ${newScreenStringPart}`;
				}
			}

			if (rootCss) {
				variablesCss += `:root {${newLine}${rootCss}}${newLine}`;
			}

			const screensToSort: ScreensToSortMapType = new Map();

			for (const [key, screenData] of Object.entries(this.screens)) {
				const screenRegExp = new RegExp(`(?:\\s|^)\\b${key}`, 'g');
				let screenMatches: RegExpExecArray;

				while ((screenMatches = screenRegExp.exec(screensString))) {
					if (screenMatches === null) {
						continue;
					}
					const matchedScreen = screenMatches[0].trim();
					screensToSort.set(
						`@media ${typeof screenData === 'function' ? screenData(matchedScreen) : screenData}`,
						this.variables[matchedScreen]
					);
					screensString = screensString.replace(new RegExp(`(?:\\s|^)${matchedScreen}`), '');
				}
			}

			const sortedScreens = screensSorter.sortCssTreeMediaQueries(screensToSort);

			for (const screen of sortedScreens.keys()) {
				const screenVariables: Record<string, string|number> = sortedScreens.get(screen);
				let screenCss = '';
				for (const [variable, value] of Object.entries(screenVariables)) {
					screenCss += makeVariableString(variable, String(value));
				}
				variablesCss += `${screen} {${newLine}:root {${newLine}${screenCss}}${newLine}}${newLine}`;
			}

			screensString = screensString.trim();

			if (screensString.length) {
				for (let screen of screensString.split(' ')) {
					screen = MacroMatch.replaceCharactersAliases(screen, 'space');
					variablesCss += `${screen} {${newLine}`;

					for (const [variable, value] of Object.entries(this.variables[screen])) {
						variablesCss += makeVariableString(variable, value);
					}

					variablesCss += `}${newLine}`;
				}
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

		hooks.callHook('compiler:compilationResultConfigured', compilationResult);

		return compilationResult;
	}

	private processCustomSelectors(): Record<string, string> {
		const selectorsMap: Record<string, string> = {};

		for (const [selector, config] of Object.entries(this.customSelectors)) {
			for (const customSelector of config.customSelectors) {
				const generatedCssEntries = customSelector.generateSelectors(selector);

				for (const [customSelector, customSelectorSelectors] of Object.entries(generatedCssEntries)) {
					if (!(customSelector in selectorsMap)) {
						selectorsMap[customSelector] = '';
					}

					const selectorsToAdd = selectorsMap[customSelector].split(' ');

					customSelectorSelectors.split(' ').forEach((selector) => {
						if (!selectorsToAdd.includes(selector) && selector.trim().length !== 0) {
							selectorsToAdd.push(selector);
						}
					});

					selectorsMap[
						this.rewriteSelectors({
							content: customSelector,
							rewriteOnlyInAreas: false,
							matchSelectorsWithPrefixes: true
						})
					] = selectorsToAdd.join(' ').replace(/\s/g, ' ').trim();
				}
			}
		}

		return selectorsMap;
	}

	private processComponents(content: string): void {
		for (const [componentName, config] of Object.entries(this.components)) {
			const regExp = new RegExp(componentName, 'g');
			let componentMatches: RegExpExecArray;

			while ((componentMatches = regExp.exec(content))) {
				const componentClassSelector = `.${
					this.mangleSelectors
						? minifiedSelectorGenerator.getMangledSelector(componentMatches[0])
						: componentMatches[0]
				}`;

				for (const customSelector of config.customSelectors) {
					const generatedCssEntries = Object.entries(
						customSelector.generateSelectors(componentClassSelector)
					);

					for (const [componentCustomSelector, selectorsToAttach] of generatedCssEntries) {
						this.addCustomSelector(componentCustomSelector, selectorsToAttach);
					}
				}
			}
		}
	}

	private processMacros(content: string, compilationResult: CompilationResult) {
		const regExpEndPart = `(?=['"\`{}\\[\\]<>\\s]|$)`;
		const regExpGenerators = [
			// Match with media query and without pseudo class
			(macroKey: string): RegExp => new RegExp(`\\b(?:([a-zA-Z0-9-:&|]+):)${macroKey}${regExpEndPart}`, 'g'),
			// Match without media query and without pseudo class
			// () - empty pseudo class and media query match
			(macroKey: string): RegExp => new RegExp(`\\b()${macroKey}${regExpEndPart}`, 'g')
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

					for (const [property, propertyValue] of Object.entries(selectorProperties.properties)) {
						selectorProperties.properties[property] = this.processHelpers(propertyValue);
					}

					for (const [property, value] of Object.entries(selectorProperties.properties)) {
						selectorProperties.properties[property] = this.replaceVariableString(value);
					}

					hooks.callHook('compiler:newMacroMatch', {
						macroMatch: macroMatch,
						selectorProperties,
						dev: this.dev,
						variables: this.variables,
						helpers: this.helpers
					});

					compilationResult.addCssRecord(macroMatch, selectorProperties);

					return '';
				});
			}
		}
	}

	private processHelpers(content: string, replaceByVariable = true): string {
		return content.replace(/(?:^|\s+)(\S+)\(([^)]+)\)/g, (fullMatch, helperName: string, helperArguments: string) => {
			if (!(helperName in this.helpers)) {
				return fullMatch;
			}

			const cssVariableEnabled = this.replaceVariablesByCssVariables && replaceByVariable;
			const helperResultVariableName = `${helperName}${helperArguments}`.replace(/[^a-zA-Z0-9]/g, '-').replace(/[^a-zA-Z0-9]$/g, '');
			let matchedHelperResult = this.processedHelpers[helperResultVariableName] ?? null;

			if (!matchedHelperResult) {
				const helperArgumentPlaceholderStart = '_ARG';
				const helperArgumentPlaceholderEnd = '_';
				const helperArgumentRegExp = new RegExp(`${helperArgumentPlaceholderStart}(\\d+)${helperArgumentPlaceholderEnd}`);
				const helperArgumentsPlaceholders: string[] =[];
				const helperArgumentsArray: (string|number)[] = helperArguments
					.replace(/'([^']+)'/g, (fullMatch, helperArgument: string): string => {
						const helperPlaceholderKey = helperArgumentsPlaceholders.length;
						helperArgumentsPlaceholders.push(helperArgument);
						return `${helperArgumentPlaceholderStart}${helperPlaceholderKey}${helperArgumentPlaceholderEnd}`;
					})
					.split(',')
					.map((helperArgument: string) => {
						helperArgument = helperArgument.replace(
							helperArgumentRegExp,
							(fullMatch: string, placeholderKeyMatch: string) => {
								return helperArgumentsPlaceholders[placeholderKeyMatch] as string;
							});

						if (helperArgument.startsWith('$')) {
							const helperValue = this.variables[helperArgument.slice(1)];

							if (!helperValue) {
								throw new Error( `Variable "${helperArgument}" not found when processing helper "${helperName}".`);
							} else if (['string', 'number'].includes(typeof helperValue)) {
								helperArgument = String(helperValue);

							} else {
								throw new Error(`Screen "${helperArgument}" cannot be used as value in helper "${helperName}".`);
							}
						}

						return isNaN(Number(helperArgument)) ? helperArgument : parseFloat(helperArgument);
					});

				matchedHelperResult = this.helpers[helperName](...helperArgumentsArray) as string;

				if (cssVariableEnabled) {
					this.addVariables({[helperResultVariableName]: matchedHelperResult});
				}
			}

			return fullMatch.replace(
				`${helperName}(${helperArguments})`,
				cssVariableEnabled ? `var(--${helperResultVariableName})` : matchedHelperResult as string
			);
		});
	}

	private replaceVariableString(string: string): VariablesTypeValue {
		return string.replace(
			this.variableRegExp,
			(match, substring: string): string => {
				if (!(substring in this.variables)) {
					throw new Error(`Stylify: Variable "${substring}" not found when processing "${string}".`);
				}
				return this.replaceVariablesByCssVariables
					? `var(--${substring})`
					: this.variables[substring] as VariablesTypeValue;
			}
		);
	}

	private processOptionsFromContent(options: Record<string, string[]>) {
		let contentOptions: Record<string, any> = {};

		for (const [option, optionValues] of Object.entries(options)) {
			for (const optionValue of optionValues) {
				try {
					if (option === 'pregenerate') {
						contentOptions[option] += ` ${optionValue}`;

					} else if (
						['components', 'variables', 'keyframes', 'customSelectors', 'screens'].includes(option)
					) {
						contentOptions[option] = {
							...contentOptions[option],
							// eslint-disable-next-line @typescript-eslint/no-implied-eval
							...new Function(`return {${optionValue.trim()}}`)()
						};
					} else {
						const hookData = hooks.callHook(`compiler:processContentOption:${option}`, {
							contentOptions: contentOptions,
							option: option,
							value: optionValue
						});

						contentOptions = hookData.contentOptions;
					}

				} catch (error) {
					if (this.dev) {
						console.error(
							`Error "${error as string}" occurred when processing "${option}" and its value "${optionValue}".`
						);
					}
				}
			}
		}

		return contentOptions;
	}

}
