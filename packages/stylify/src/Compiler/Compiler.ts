import {
	CompilationResult,
	MacroMatch,
	SelectorProperties,
	SelectorsComponentsMapType,
	SelectorsListInterface,
	stringHashCode
} from '.';

export type MacroCallbackType = (macroMatch: MacroMatch, selectorProperties: SelectorProperties) => void;

export type ScreenCallbackType = (screen: string) => string;

export interface SerializedCompilerInterface {
	selectorsList: SelectorsListInterface
}

export type ComponentSelectorsType = string|string[];

export type PlainSelectorDependencySelectorsType = string|string[];

export interface PlainSelectorInterface {
	selectors: string[]
}

export interface ComponentConfigInterface {
	selectors: ComponentSelectorsType
	selectorsChain: string|string[],
}

export interface CompilerContentOptionsInterface {
	pregenerate: string,
	components: Record<string, any>,
	variables: Record<string, any>,
	plainSelectors: Record<string, any>
	screens: Record<string, any>
}

export type OnPrepareCompilationResultCallbackType = (compilationResult: CompilationResult) => void;

export type ContentOptionsProcessorCallbackType = (
	contentOptions: Partial<CompilerContentOptionsInterface>,
	optionMatchValue: string
	) => Partial<CompilerContentOptionsInterface>;

export type ContentOptionsProcessorsType = Record<string, ContentOptionsProcessorCallbackType>;

export type MacrosType = Record<string, MacroCallbackType>;

export type HelpersType = Record<string, CallableFunction>;

export type ScreensType = Record<string, string|ScreenCallbackType>;

export type VariablesType = Record<string, string|number>;

export interface CompilerConfigInterface {
	dev?: boolean,
	macros?: MacrosType,
	helpers?: HelpersType,
	variables?: VariablesType,
	screens?: ScreensType,
	plainSelectors?: Record<string, PlainSelectorDependencySelectorsType>,
	mangleSelectors?: boolean,
	pregenerate?: string[]|string,
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

	public components: Record<string, ComponentsInterface> = {};

	public pregenerate = '';

	public selectorsAreas = ['(?:^|\\s+)class="([^"]+)"', '(?:^|\\s+)class=\'([^\']+)\''];

	public plainSelectors: Record<string, PlainSelectorInterface> = {};

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
		for (const plainSelector in plainSelectors) {
			this.addPlainSelector(plainSelector, plainSelectors[plainSelector]);
		}

		const components = config.components || {};
		for (const componentSelector in components) {
			this.addComponent(componentSelector, components[componentSelector]);
		}

		return this;
	}

	public addPlainSelector(selector: string, dependencySelectors: PlainSelectorDependencySelectorsType): void {
		const selectorsArray = selector.split(', ');

		for (const selector of selectorsArray) {
			dependencySelectors = this.convertStringOrStringArrayToFilteredArray(dependencySelectors);
			if (selector in this.plainSelectors) {
				this.plainSelectors[selector].selectors = [
					...this.plainSelectors[selector].selectors,
					...dependencySelectors
				];
				return;
			}

			this.plainSelectors[selector] = {
				selectors: dependencySelectors
			};
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
					...configIsArray ? config: [config],
					...componentAlreadyDefined ? this.components[selector].selectors : []
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
			mangledSelector: stringHashCode(selector)
		};

		return this;
	}

	private convertStringOrStringArrayToFilteredArray(data: string|string[]): string[] {
		if (Array.isArray(data)) {
			data = data.join(' ');
		}

		return data.replace(/\s/ig, ' ').split(' ').filter((value: string, index, self): boolean => {
			return value.trim().length > 0 && self.indexOf(value) === index;
		});
	}

	public addMacro(re: string, callback: MacroCallbackType): Compiler {
		this.macros[re] = callback;
		return this;
	}

	public rewriteSelectors(
		content: string,
		compilationResult: CompilationResult,
		rewriteOnlyInAreas = true
	): string {
		if (this.dev && !this.mangleSelectors) {
			return content;
		}

		const placeholderTextPart = '__STYLIFY_PLACEHOLDER__';
		const contentPlaceholders: Record<string, any> = {};

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

		compilationResult = this.prepareCompilationResult(compilationResult);

		content = content
			.replace(new RegExp(this.ignoredAreasRegExpString, 'g'), (...args): string => {
				const matchArguments = args.filter((value) => typeof value === 'string');
				const fullMatch: string = matchArguments[0];
				const innerHtml: string = matchArguments[1];

				return typeof innerHtml === 'undefined' || innerHtml.length === 0
					? fullMatch
					: fullMatch.replace(innerHtml, '');
			})
			.replace(/\r\n|\r|\n|\t/ig, ' ')
			.replace(/&amp;/ig, '&');

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
			plainSelectorsSelectorsMap[plainSelector] = plainSelectorData.selectors;
			this.pregenerate += ' ' + plainSelectorData.selectors.join(' ');
		}

		contentToProcess = `${this.pregenerate} ${contentToProcess}`;
		this.pregenerate = '';

		if (compilationResult && Object.keys(compilationResult.selectorsList).length) {
			contentToProcess = contentToProcess.replace(/_\w+/ig, (matched) => {
				return matched in compilationResult.selectorsList ? stringHashCode(matched) : matched;
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

	public createCompilationResultFromSerializedData(data: string|Record<string, any>): CompilationResult {
		return new CompilationResult(typeof data === 'string' ? JSON.parse(data) : data);
	}

	private prepareCompilationResult(compilationResult: CompilationResult = null): CompilationResult
	{
		if (!compilationResult) {
			compilationResult = new CompilationResult();
		}

		let variablesCss = '';

		if (this.injectVariablesIntoCss && Object.keys(this.variables).length) {
			const newLine = this.dev ? '\n' : '';
			variablesCss += `:root {${newLine}`;
			for (const variable in this.variables) {
				variablesCss += `--${variable}: ${this.variables[variable]};${newLine}`;
			}
			variablesCss += `}${newLine}`;
		}

		compilationResult.configure({
			dev: this.dev,
			mangleSelectors: this.mangleSelectors,
			defaultCss: variablesCss
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
					const macroMatches = args.slice(0, args.length - 2);
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
			variables: {}
		};

		const regExp = new RegExp(this.contentOptionsRegExp.source, 'g');
		let optionMatch: RegExpMatchArray;

		while ((optionMatch = regExp.exec(content))) {
			if (![typeof optionMatch[1], typeof optionMatch[2]].includes('string')) {
				continue;
			}

			const optionKey = optionMatch[1];
			const optionMatchValue = optionMatch[2].replace(/\n|\t/g, ' ');

			try {
				if (optionKey === 'pregenerate') {
					contentOptions[optionKey] += ` ${optionMatchValue}`;

				} else if (['components', 'variables', 'plainSelectors', 'screens'].includes(optionKey)) {
					contentOptions[optionKey] = {
						...contentOptions[optionKey],
						// eslint-disable-next-line @typescript-eslint/no-implied-eval
						...new Function(`return {${optionMatchValue}}`)()
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
