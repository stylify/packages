import {
	CompilationResult,
	MacroMatch,
	SelectorProperties,
	SelectorsComponentsMapType,
	minifiedSelectorGenerator,
	screensSorter,
	ScreensToSortMapType,
	defaultPreset
} from '.';

import { logOrError } from '../Utilities';

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

type VariablesTypeValue = string;

export type VariablesType = Record<string, VariablesTypeValue|Record<string, string>>;

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

	private readonly textPlaceholder = '_TEXT_';

	private readonly dollarPlaceholder = '_DOLLAR_';

	private readonly selectorsSpaceCharacter = '__';

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
		this.macros = {...this.macros, ...config.macros ?? {}};
		this.helpers = {...this.helpers, ...config.helpers ?? {}};
		this.keyframes = {...this.keyframes, ...config.keyframes ?? {}};
		this.screens = {...this.screens, ...config.screens ?? {}};
		this.contentOptionsProcessors = {...this.contentOptionsProcessors, ...config.contentOptionsProcessors};
		this.injectVariablesIntoCss = config.injectVariablesIntoCss ?? this.injectVariablesIntoCss;
		this.selectorsAreas = [...this.selectorsAreas, ...config.selectorsAreas ?? []];
		this.onPrepareCompilationResult = config.onPrepareCompilationResult ?? this.onPrepareCompilationResult;
		this.onNewMacroMatch = config.onNewMacroMatch ?? this.onNewMacroMatch;
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

		for (const [plainSelector, dependencySelectors] of Object.entries(config.plainSelectors ?? {})) {
			this.addPlainSelector(plainSelector, dependencySelectors);
		}

		for (const [componentSelector, selectorDependencies] of Object.entries(config.components ?? {})) {
			this.addComponent(componentSelector, selectorDependencies);
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
			selector.split(',').forEach((selector) => this.addComponent(selector.trim(), config));
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

		this.configure(this.getOptionsFromContent(content));
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

		const selectorsComponentsMap: SelectorsComponentsMapType = {};

		Object.keys(this.components).forEach((componentsSelector) => {
			if (!new RegExp(`${componentsSelector}`, 'g').test(contentToProcess)) {
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

		compilationResult = compilationResult ?? new CompilationResult();

		this.processMacros(contentToProcess, compilationResult);

		this.prepareCompilationResult(compilationResult);

		compilationResult.bindPlainSelectorsToSelectors(plainSelectorsSelectorsMap);
		compilationResult.bindComponentsToSelectors(selectorsComponentsMap);

		return compilationResult;
	}

	private prepareCompilationResult(compilationResult: CompilationResult): CompilationResult
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

				const newScreenStringPart = variableOrScreen.replace(' ', this.selectorsSpaceCharacter);
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
					screen = screen.replace(this.selectorsSpaceCharacter, ' ');
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

		if (this.onPrepareCompilationResult) {
			this.onPrepareCompilationResult(compilationResult);
		}

		return compilationResult;
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
								logOrError(
									`Variable "${helperArgument}" not found when processing helper "${helperName}"`,
									this.dev
								);
							} else if (['string', 'number'].includes(typeof helperValue)) {
								helperArgument = String(helperValue);

							} else {
								logOrError(
									`Screen "${helperArgument}" cannot be used as value in helper "${helperName}"`,
									this.dev
								);
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
					logOrError(`Stylify: Variable "${substring}" not found when processing "${string}".`, this.dev);
				}
				return this.replaceVariablesByCssVariables
					? `var(--${substring})`
					: this.variables[substring] as VariablesTypeValue;
			}
		);
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
