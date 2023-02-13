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
import { escapeCssSelector, getStringOriginalStateAfterReplace, prepareStringForReplace, tokenize } from '../Utilities';

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
	'compiler:newMacroMatch': MacroCallbackDataInterface,
	[key: `compiler:processContentOption:${string}`]: {
		contentOptions: Record<string, any>,
		key: string,
		value: string
	}
}

export interface MacroCallbackDataInterface {
	dev: boolean,
	helpers: HelpersType,
	variables: VariablesType,
	macroMatch: MacroMatch,
	selectorProperties: SelectorProperties
}

export type MacroCallbackType = (data: MacroCallbackDataInterface) => void;

export type ScreenCallbackType = (screen: string) => string;

export interface CustomSelectorInterface {
	selectors: string[]
}

export type ComponentsType = Record<string, ComponentsInterface>;

export type MacrosType = Record<string, MacroCallbackType>;

export type HelpersType = Record<string, CallableFunction>;

export type ScreensType = Record<string, string|ScreenCallbackType>;

type VariablesTypeValue = string;

export type VariablesType = Record<string, VariablesTypeValue|Record<string, string>>;

export type ExternalVariableCallbackType = (variable: string) => boolean|void;

export type ExternalVariablesType = (string|ExternalVariableCallbackType)[];

export interface IsVariableDefinedInterface {
	defined: boolean,
	isExternal: boolean
}

export type KeyframesType = Record<string, string>;

export type CustomSelectorType = Record<string, string>;

export type PregenerateType = string[]|string;

export type ComponentType = Record<string, string|ComponentGeneratorFunctionType>;

export interface CompilerConfigInterface {
	dev?: boolean,
	macros?: MacrosType,
	helpers?: HelpersType,
	variables?: VariablesType,
	externalVariables?: ExternalVariablesType,
	keyframes?: KeyframesType,
	screens?: ScreensType,
	customSelectors?: CustomSelectorType,
	mangleSelectors?: boolean,
	pregenerate?: PregenerateType,
	components?: ComponentType,
	ignoredAreas?: RegExp[],
	selectorsAreas?: string[],
	replaceVariablesByCssVariables?: boolean,
	injectVariablesIntoCss?: boolean
	matchCustomSelectors?: boolean
}

export type CustomSelectorTypeType = 'custom' | 'customMatchedInClass' | 'component' | 'utilitiesGroup';

export interface CustomSelectorsInterface {
	customSelectors: CustomSelector[],
	type: CustomSelectorTypeType
}

export interface ComponentGeneratorFunctionDataInterface {
	dev: boolean,
	helpers: HelpersType,
	variables: VariablesType,
	matches: RegExpExecArray
}

export type ComponentGeneratorFunctionType = (data: ComponentGeneratorFunctionDataInterface) => string;

export interface ComponentsInterface {
	selectorsOrGenerators: (string|ComponentGeneratorFunctionType)[]
}

export class Compiler {

	private readonly macroRegExpEndPart = `(?=['"\`{}\\[\\]<>\\s]|$)`;

	private readonly textPlaceholder = '_TEXT_';

	private readonly variableRegExp = /\$([\w-_]+)/g;

	private readonly contentOptionsRegExp = /stylify-([a-zA-Z-_0-9]+)\s([\s\S]+?)\s\/stylify-[a-zA-Z-_0-9]+/;

	private readonly macrosRegExpGenerators = [
		// Match with media query and without pseudo class
		(macroKey: string): RegExp => new RegExp(`(?:([a-zA-Z0-9\\-:&\\|]+):)${macroKey}${this.macroRegExpEndPart}`, 'g'),
		// Match without media query and without pseudo class
		// () - empty pseudo class and media query match
		(macroKey: string): RegExp => new RegExp(`\\b()${macroKey}${this.macroRegExpEndPart}`, 'g')
	];

	private ignoredAreasRegExpString: string = null;

	public ignoredAreas = [
		/stylify-ignore([\s\S]*?)\/stylify-ignore/,
		/<code[\s]*?>([\s\S]*?)<\/code>/,
		/<head[\s]*?>([\s\S]*?)<\/head>/,
		/<pre[\s]*?>([\s\S]*?)<\/pre>/,
		/<script[\s]*?>([\s\S]*?)<\/script>/,
		/<style[\s]*?>([\s\S]*?)<\/style>/
	];

	public mangleSelectors = false;

	public dev = false;

	public macros: MacrosType = {};

	public helpers: HelpersType = {};

	public screens: ScreensType = {};

	public variables: VariablesType = {};

	public externalVariables: ExternalVariablesType = [];

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

		if (Object.keys(config).length) {
			this.configure(config);
		}
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
		this.externalVariables = [
			...this.externalVariables,
			...config.externalVariables ?? []
		];
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

		for (const [componentSelector, componentStringOrGenerator] of Object.entries(config.components ?? {})) {
			this.addComponent(componentSelector, componentStringOrGenerator);
		}

		return this;
	}

	public addVariables(variables: VariablesType, screen: string = null): void {
		for (const [variableOrScreen, valueOrVariables] of Object.entries(variables)) {
			if (!['string', 'number'].includes(typeof valueOrVariables)) {
				this.addVariables(valueOrVariables as VariablesType, variableOrScreen);
				continue;
			}

			const processedValue = this.replaceVariableString(this.processHelpers({
				content: String(valueOrVariables),
				replaceByVariable: false,
				variablesScope: screen
			}));

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

	public addCustomSelector(
		selector: string,
		selectors: string,
		selectorCanBeSplit = true,
		type: CustomSelectorTypeType = 'custom'
	): void {
		if (selectorCanBeSplit && selector.includes(',')) {
			selector.split(',').forEach((selectorSplit) => this.addCustomSelector(selectorSplit.trim(), selectors));
			return;
		}

		if (!(selector in this.customSelectors)) {
			this.customSelectors[selector] = {
				customSelectors: [],
				type
			};
		}

		this.customSelectors[selector].customSelectors.push(new CustomSelector(selectors));
	}

	public addComponent(selector: string, selectorsOrGenerator: string|ComponentGeneratorFunctionType): Compiler {
		if (selector.includes(',')) {
			selector.split(',').forEach((selector) => this.addComponent(selector.trim(), selectorsOrGenerator));
			return;
		}

		if (!(selector in this.components)) {
			this.components[selector] = {
				selectorsOrGenerators: []
			};
		}

		const isGenerator = typeof selectorsOrGenerator === 'function';
		const definedSelectorsOrGenerators = this.components[selector].selectorsOrGenerators;

		if (!isGenerator && definedSelectorsOrGenerators.includes(selectorsOrGenerator)) {
			return;

		} else if (isGenerator) {
			for (const definedSelectorOrGenerator of definedSelectorsOrGenerators) {
				if (typeof definedSelectorOrGenerator !== 'function') {
					continue;
				}

				if (definedSelectorOrGenerator.toString() === selectorsOrGenerator.toString()) {
					return;
				}
			}
		}

		this.components[selector].selectorsOrGenerators.push(selectorsOrGenerator);

		return this;
	}

	public addMacro(re: string, callback: MacroCallbackType): Compiler {
		this.macros[re] = callback;
		return this;
	}

	public rewriteSelectors(options: {
		content: string,
		rewriteOnlyInSelectorsAreas?: boolean
		matchSelectorsWithPrefixes?: boolean
	}|string): string {
		let rewriteOnlyInSelectorsAreas = true;
		let matchSelectorsWithPrefixes = false;
		let content = '';

		if (typeof options === 'string') {
			content = options;
		} else {
			content = options.content;
			rewriteOnlyInSelectorsAreas = options.rewriteOnlyInSelectorsAreas ?? rewriteOnlyInSelectorsAreas;
			matchSelectorsWithPrefixes = options.matchSelectorsWithPrefixes ?? matchSelectorsWithPrefixes;
		}

		if (!this.mangleSelectors) {
			return content;
		}

		const placeholderTextPart = this.textPlaceholder;
		const contentPlaceholders: Record<string, string> = {};

		const placeholderInserter = (matched: string) => {
			const placeholderKey = `${placeholderTextPart}${Object.keys(contentPlaceholders).length}`;
			contentPlaceholders[placeholderKey] = matched;
			return placeholderKey;
		};

		content = prepareStringForReplace(content)
			.replace(new RegExp(this.ignoredAreasRegExpString, 'g'), (...args): string => {
				const matchArguments = args.filter((value) => typeof value === 'string');
				const fullMatch: string = matchArguments[0];
				const innerMatch: string = matchArguments[1];

				return typeof innerMatch === 'undefined' || innerMatch.length === 0
					? fullMatch
					: fullMatch.replace(innerMatch, placeholderInserter(innerMatch));
			})
			.replace(
				new RegExp(this.contentOptionsRegExp.source, 'g'),
				(matched: string) => placeholderInserter(matched)
			);

		const selectorsListKeys = Object.keys(minifiedSelectorGenerator.processedSelectors)
			.sort((a: string, b: string): number => b.length - a.length);

		for (const selector of selectorsListKeys) {
			let selectorToReplace = prepareStringForReplace(selector);

			if (!content.includes(selectorToReplace)) {
				continue;
			}

			const mangledSelector = minifiedSelectorGenerator.getMangledSelector(selector);
			const selectorPrefix = matchSelectorsWithPrefixes
				? minifiedSelectorGenerator.getSelectorPrefix(selector)
				: '';

			selectorToReplace = selectorToReplace.replace(/\\/g, '\\\\');
			selectorToReplace = escapeCssSelector(
				minifiedSelectorGenerator.getStringToMatch(selectorToReplace, matchSelectorsWithPrefixes)
			);

			const replacement = `${selectorPrefix}${mangledSelector}`;
			const selectorToReplaceRegExp = new RegExp(selectorToReplace, 'g');

			if (rewriteOnlyInSelectorsAreas === false) {
				content = content.replace(selectorToReplaceRegExp, replacement);
				continue;
			}

			for (const rewriteSelectorAreaRegExpString of this.selectorsAreas) {
				content = content.replace(
					new RegExp(rewriteSelectorAreaRegExpString, 'g'),
					(fullMatch: string, selectorMatch: string): string => {
						const selectorReplacement = selectorMatch.replace(selectorToReplaceRegExp, replacement);
						return fullMatch.replace(selectorMatch, selectorReplacement);
					}
				);
			}
		}

		for (const [placeholderKey, contentPlaceholder] of Object.entries(contentPlaceholders)) {
			content = content.replace(placeholderKey, contentPlaceholder);
		}

		content = getStringOriginalStateAfterReplace(content);

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

		content = content.replace(/\r\n|\r/ig, '\n');

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
				(fullMatch: string, cssSelectors: string, stylifySelectors: string) => {
					const customSelector = MacroMatch.replaceCharactersAliases(cssSelectors);
					const customSelectorSelector = this.mangleSelectors
						? minifiedSelectorGenerator.generateMangledSelector(fullMatch, null)
						: fullMatch;

					this.addCustomSelector(
						customSelectorSelector,
						`${customSelector}{${stylifySelectors.replace(/;/g, ' ')}}`,
						false,
						'customMatchedInClass'
					);

					return '';
				}
			);

			contentToProcess = contentToProcess.replace(
				/(\S+):{([^{}]+)}/g,
				(fullMatch: string, screenAndPseudoClasses: string, stylifySelectors: string) => {
					const customSelectorSelector = this.mangleSelectors
						? minifiedSelectorGenerator.generateMangledSelector(fullMatch, null)
						: fullMatch;

					this.addCustomSelector(
						customSelectorSelector,
						stylifySelectors.split(';')
							.map((stylifySelector) => `${screenAndPseudoClasses}:${stylifySelector}`)
							.join(' '),
						false,
						'utilitiesGroup'
					);

					return '';
				}
			);
		}

		this.processComponents(contentToProcess);

		const customSelectorsSelectorsMap: Record<string, string> = this.processCustomSelectors();

		compilationResult = compilationResult ?? new CompilationResult();

		hooks.callHook('compiler:beforeMacrosProcessed', compilationResult);

		this.processMacros(contentToProcess, compilationResult);
		this.processMacros(Object.values(customSelectorsSelectorsMap).join(' '), compilationResult, false);

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
			const optionValue = optionMatch[2];

			if (!(option in contentOptions)) {
				contentOptions[option] = [];
			}

			contentOptions[option].push(optionValue);
		}

		return contentOptions as Data;
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
			const isComponent = config.type === 'component';
			const isUtilitiesGroup = config.type === 'utilitiesGroup';
			const isCustomSelectorMatchedInClass = config.type === 'customMatchedInClass';
			const isClassSelector = isComponent || isUtilitiesGroup || isCustomSelectorMatchedInClass;
 			const preparedEscapedSelector = this.mangleSelectors || config.type === 'custom'
				? selector
				: escapeCssSelector(selector, isComponent || isUtilitiesGroup || isCustomSelectorMatchedInClass);

			for (const customSelector of config.customSelectors) {
				const generatedCssEntries = customSelector.generateSelectors(
					`${isClassSelector ? '.':''}${preparedEscapedSelector}`
				);

				let cssSelector: string;
				let stylifySelectors: string;
				for ([cssSelector, stylifySelectors] of Object.entries(generatedCssEntries)) {
					if (this.mangleSelectors && isComponent) {
						const preparedCssSelector = prepareStringForReplace(cssSelector);
						const preparedSelector = prepareStringForReplace(preparedEscapedSelector);

						cssSelector = preparedCssSelector.replace(
							new RegExp(`\\.(${preparedSelector}\\S*)`),
							(fullMatch: string, componentSelector: string) => {
								let clearedComponentName = '';
								const tokenizableComponentSelector = getStringOriginalStateAfterReplace(
									componentSelector
								);

								tokenize(tokenizableComponentSelector, ({ token, previousToken }) => {
									const isCorrectToken = (/\w|-|\\|\$/).test(token);

									if (!isCorrectToken && previousToken !== '\\') {
										return true;
									}

									clearedComponentName += token;
								});

								return fullMatch.substring(1).replace(
									prepareStringForReplace(clearedComponentName),
									`.${minifiedSelectorGenerator.generateMangledSelector(clearedComponentName)}`
								);
							});
					}

					if (this.mangleSelectors) {
						cssSelector = this.rewriteSelectors({
							content: cssSelector,
							rewriteOnlyInSelectorsAreas: false,
							matchSelectorsWithPrefixes: true
						});
					}

					selectorsMap[cssSelector] = [selectorsMap[cssSelector] ?? '', ...stylifySelectors.split(' ')]
						.filter((item, index, self) => {
							return item.trim().length > 0 && self.indexOf(item) === index;
						})
						.join(' ')
						.replace(/\s/g, ' ')
						.trim();
				}
			}
		}

		return selectorsMap;
	}

	private processComponents(content: string): void {
		for (const [componentName, config] of Object.entries(this.components)) {
			const regExp = new RegExp(`\\b${componentName + this.macroRegExpEndPart}`, 'g');
			let componentMatch: RegExpExecArray;

			while ((componentMatch = regExp.exec(content))) {
				const componentSelector = componentMatch[0];

				for (const selectorsOrGenerator of config.selectorsOrGenerators) {
					const componentSelectors = typeof selectorsOrGenerator === 'function'
						? selectorsOrGenerator({
							matches: componentMatch,
							dev: this.dev,
							variables: this.variables,
							helpers: this.helpers
						})
						: selectorsOrGenerator;

					minifiedSelectorGenerator.generateMangledSelector(componentSelector);

					this.addCustomSelector(componentSelector, componentSelectors, false, 'component');
				}
			}
		}
	}

	private processMacros(content: string, compilationResult: CompilationResult, utilitiesShouldBeGenerated = true) {
		if (!content.trim()) {
			return;
		}

		for (const regExpGenerator of this.macrosRegExpGenerators) {
			for (const macroKey in this.macros) {
				content = content.replace(regExpGenerator(macroKey), (...args) => {
					const macroMatches: string[] = args.slice(0, args.length - 2);
					const macroMatch = new MacroMatch(macroMatches, this.screens);
					const existingCssRecord = compilationResult.getCssRecord(macroMatch);

					if (existingCssRecord) {
						if (utilitiesShouldBeGenerated) {
							existingCssRecord.utilityShouldBeGenerated = utilitiesShouldBeGenerated;
						}
						return '';
					}

					const selectorProperties = new SelectorProperties();

					this.macros[macroKey]({
						macroMatch,
						selectorProperties,
						dev: this.dev,
						variables: this.variables,
						helpers: this.helpers
					});

					for (const [property, propertyValue] of Object.entries(selectorProperties.properties)) {
						selectorProperties.properties[property] = this.processHelpers({ content: propertyValue });
					}

					for (const [property, value] of Object.entries(selectorProperties.properties)) {
						selectorProperties.properties[property] = this.replaceVariableString(value);
					}

					hooks.callHook('compiler:newMacroMatch', {
						macroMatch,
						utilityShouldBeGenerated: utilitiesShouldBeGenerated,
						selectorProperties,
						dev: this.dev,
						variables: this.variables,
						helpers: this.helpers
					});

					compilationResult.addCssRecord(macroMatch, selectorProperties, utilitiesShouldBeGenerated);

					return '';
				});
			}
		}
	}

	private processHelpers({
		content,
		replaceByVariable,
		variablesScope
	}: {
		content: string,
		replaceByVariable?: boolean,
		variablesScope?: string
	}): string {
		const helperArgumentPlaceholderStart = '_ARG';
		const helperArgumentPlaceholderEnd = '_';
		const helperArgumentRegExp = new RegExp(`${helperArgumentPlaceholderStart}(\\d+)${helperArgumentPlaceholderEnd}`);
		const cssVariableEnabled = this.replaceVariablesByCssVariables && (replaceByVariable ?? true);

		return content.replace(/(?:^|\s+)(\S+)\(([^)]+)\)/g, (fullMatch, helperName: string, helperArguments: string) => {
			if (!(helperName in this.helpers)) {
				return fullMatch;
			}

			const helperResultVariableName = `${helperName}${helperArguments}`.replace(/[^a-zA-Z0-9]/g, '-').replace(/[^a-zA-Z0-9]$/g, '');
			let matchedHelperResult = this.processedHelpers[helperResultVariableName] ?? null;

			if (!matchedHelperResult) {
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
							const variableName = helperArgument.slice(1);
							const { defined, isExternal } = this.isVariableDefined(variableName, variablesScope);
							const definedVariables = variablesScope
								? this.variables[variablesScope][variableName]
								: this.variables[variableName];
							const helperValue = defined && !isExternal ? definedVariables : undefined;

							if (!defined || isExternal) {
								throw new Error(isExternal
									? `Helpers cannot use external variables. Processing helper "${helperName}" and variable "${helperArgument}".`
									: `Variable "${helperArgument}" not found when processing helper "${helperName}".`
								);
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
				const variableIsDefined = this.isVariableDefined(substring).defined;

				if (!variableIsDefined) {
					throw new Error(`Stylify: Variable "${substring}" not found when processing "${string}".`);
				}

				return this.replaceVariablesByCssVariables
					? `var(--${substring})`
					: this.variables[substring] as VariablesTypeValue ?? `$${substring}`;
			}
		);
	}

	private isVariableDefined(variable: string, variablesScope: string = null): IsVariableDefinedInterface {
		let defined = false;
		let isExternal = false;

		const definedVariables = variablesScope
			? this.variables[variablesScope] as Record<string, string>
			: this.variables;

		if (variable in definedVariables) {
			defined = true;
		} else {
			defined = this.externalVariables.includes(variable);

			if (!defined) {
				for (const externalVariableChecker of this.externalVariables) {
					if (typeof externalVariableChecker !== 'function') {
						continue;
					}

					const exists = externalVariableChecker(variable);
					defined = typeof exists === 'boolean' ? exists : false;

					if (defined) {
						break;
					}
				}
			}

			isExternal = defined;
		}

		return {
			defined,
			isExternal
		};
	}

	private processOptionsFromContent(options: Record<string, string[]>) {
		let contentOptions: Record<string, any> = {};

		for (const [option, optionValues] of Object.entries(options)) {
			for (const optionValue of optionValues) {
				try {
					if (option === 'pregenerate') {
						contentOptions[option] += ` ${optionValue}`;
					}

					else if (option === 'externalVariables') {
						contentOptions[option] = [
							...contentOptions[option] ?? [],
							...optionValue.split(/\s/).filter((item) => item.trim().length)
						];

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
