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
	processed: boolean,
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
	ignoredElements?: string[],
	rewriteSelectorsAreas?: string[],
	replaceVariablesByCssVariables?: boolean,
	injectVariablesIntoCss?: boolean
}

export type OnNewMacroMatchCallbackType = MacroCallbackType;

export interface ComponentsInterface {
	selectors: string[],
	selectorsChain: string[],
	processed: boolean,
	mangledSelector: string
}

export class Compiler {

	private readonly CONTENT_OPTIONS_REG_EXP = new RegExp('@stylify-(\\w+)\\[([^\\[\\]]+|\\n+)\\]');

	private ignoredElementsRegExp: RegExp = null;

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

	public ignoredElements = ['stylify-ignore', 'code', 'head', 'pre', 'script', 'style'];

	public rewriteSelectorsAreas = ['(?:^|\\s+)class="([^"]+)"', '(?:^|\\s+)class=\'([^\']+)\''];

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
		this.dev = typeof config.dev === 'undefined' ? this.dev : config.dev;
		this.macros = Object.assign(this.macros, config.macros || {});

		this.helpers = Object.assign(this.helpers, config.helpers || {});
		this.variables = Object.assign(this.variables, config.variables || {});
		this.screens = Object.assign(this.screens, config.screens || {});
		this.mangleSelectors = typeof config.mangleSelectors === 'undefined'
			? this.mangleSelectors
			: config.mangleSelectors;

		if (typeof config.pregenerate !== 'undefined') {
			this.pregenerate += Array.isArray(config.pregenerate) ? config.pregenerate.join(' ') : config.pregenerate;
		}
		this.contentOptionsProcessors = {...this.contentOptionsProcessors, ...config.contentOptionsProcessors};
		this.ignoredElements = [...this.ignoredElements, ...config.ignoredElements || []]
			.filter((value, index, self) => {
				return self.indexOf(value) === index;
			});

		const ignoredElements = this.ignoredElements.map((element: string): string => {
			return `<${element}[\\s\\S]*?>([\\s\\S]*?)<\\/${element}>`;
		});

		this.replaceVariablesByCssVariables = 'replaceVariablesByCssVariables' in config
			? config.replaceVariablesByCssVariables
			: this.replaceVariablesByCssVariables;
		this.injectVariablesIntoCss = 'injectVariablesIntoCss' in config
			? config.injectVariablesIntoCss
			: this.injectVariablesIntoCss;
		this.rewriteSelectorsAreas = [...this.rewriteSelectorsAreas, ...config.rewriteSelectorsAreas || []];
		this.ignoredElementsRegExp = new RegExp(ignoredElements.join('|'), 'g');
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
				processed: false,
				selectors: dependencySelectors
			};
		}
	}

	public addComponent(
		selector: string,
		componentConfig: ComponentSelectorsType|ComponentConfigInterface
	): Compiler {
		if (selector in this.components) {
			return;
		}

		if (typeof componentConfig === 'string' || Array.isArray(componentConfig)) {
			componentConfig = {
				selectors: componentConfig,
				selectorsChain: []
			};
		}

		this.components[selector] = {
			selectors: this.convertStringOrStringArrayToFilteredArray(componentConfig.selectors),
			selectorsChain: Array.isArray(componentConfig.selectorsChain)
				? componentConfig.selectorsChain
				: [componentConfig.selectorsChain],
			processed: false,
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
			.replace(new RegExp(this.ignoredElementsRegExp.source, 'g'), (...args): string => {
				const matchArguments = args.filter((value) => typeof value === 'string');
				const fullMatch: string = matchArguments[0];
				const innerHtml: string = matchArguments[1];
				return typeof innerHtml === 'undefined' || innerHtml.length === 0
					? fullMatch
					: fullMatch.replace(innerHtml, placeholderInserter(innerHtml));
			})
			.replace(new RegExp(this.CONTENT_OPTIONS_REG_EXP.source, 'g'), (matched: string) => {
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

			for (const rewriteSelectorAreaRegExpString of this.rewriteSelectorsAreas) {
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

	public compile(content: string, compilationResult: CompilationResult = null): CompilationResult {
		compilationResult = this.prepareCompilationResult(compilationResult);
		this.configure(this.getOptionsFromContent(content));

		const plainSelectorsSelectorsMap = {};
		for (const plainSelector in this.plainSelectors) {
			const plainSelectorData = this.plainSelectors[plainSelector];
			if (plainSelectorData.processed) {
				continue;
			}

			plainSelectorsSelectorsMap[plainSelector] = plainSelectorData.selectors;
			this.pregenerate += ' ' + plainSelectorData.selectors.join(' ');
			this.plainSelectors[plainSelector].processed = true;
		}

		content = `${this.pregenerate} ${content}`;
		this.pregenerate = '';

		content = content
			.replace(new RegExp(this.ignoredElementsRegExp.source, 'g'), (...args): string => {
				const matchArguments = args.filter((value) => typeof value === 'string');
				const fullMatch: string = matchArguments[0];
				const innerHtml: string = matchArguments[1];
				return typeof innerHtml === 'undefined' || innerHtml.length === 0
					? fullMatch
					: fullMatch.replace(innerHtml, '');
			})
			.replace(new RegExp(this.CONTENT_OPTIONS_REG_EXP.source, 'g'), '')
			.replace(/\r\n|\r|\n|\t/ig, ' ')
			.replace(/&amp;/ig, '&');

		if (compilationResult && Object.keys(compilationResult.selectorsList).length) {
			content = content.replace(/_\w+/ig, (matched) => {
				return matched in compilationResult.selectorsList ? stringHashCode(matched) : matched;
			});
		}

		const selectorsComponentsMap: SelectorsComponentsMapType = {};

		Object.keys(this.components)
			.filter((element): boolean => {
				if (element in compilationResult.componentsList) {
					this.components[element].processed = true;
				}

				return this.components[element].processed === false;
			})
			.forEach((notProcessedComponentsSelector) => {
				if (!content.match(new RegExp(`${notProcessedComponentsSelector}\\b`, 'g'))) {
					return;
				}

				const { selectors, selectorsChain } = this.components[notProcessedComponentsSelector];
				content += ` ${selectors.join(' ')}`;

				selectors.forEach((componentDependencySelector: string): void => {
					if (! (componentDependencySelector in selectorsComponentsMap)) {
						selectorsComponentsMap[componentDependencySelector] = [];
					}

					selectorsComponentsMap[componentDependencySelector].push({
						component: notProcessedComponentsSelector,
						selectorsChain: selectorsChain
					});
				});

				this.components[notProcessedComponentsSelector].processed = true;
			});

		this.processMacros(content, compilationResult);

		compilationResult.bindPlainSelectorsToSelectors(plainSelectorsSelectorsMap);
		compilationResult.bindComponentsToSelectors(selectorsComponentsMap);

		return compilationResult;
	}

	public hydrate(data: Required<SerializedCompilerInterface>): void {
		Object.keys(this.components).forEach(selector => {
			for (const componentSelector of this.components[selector].selectors) {
				if (! (componentSelector in data.selectorsList && data.selectorsList[componentSelector].processed)) {
					continue;
				}

				this.components[selector].processed = true;
				break;
			}
		});
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
		for (const macroKey in this.macros) {
			const macroRe = new RegExp(`(?:([a-z0-9-:&|]+):)?\\b${macroKey}`, 'g');
			let macroMatches: string[];

			while ((macroMatches = macroRe.exec(content))) {
				const macroMatch = new MacroMatch(macroMatches, this.screens);

				if (macroMatch.fullMatch in compilationResult.selectorsList) {
					compilationResult.selectorsList[macroMatch.fullMatch].shouldBeGenerated = true;
					continue;
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
			}
		}
	}

	public getOptionsFromContent(content: string): CompilerContentOptionsInterface {
		let contentOptions: CompilerContentOptionsInterface = {
			pregenerate: '',
			components: {},
			plainSelectors: {},
			variables: {}
		};

		const regExp = new RegExp(this.CONTENT_OPTIONS_REG_EXP.source, 'g');
		let optionMatch: RegExpMatchArray;

		while ((optionMatch = regExp.exec(content))) {
			if (typeof optionMatch[1] !== 'string' || typeof optionMatch[2] !== 'string') {
				continue;
			}

			const optionKey = optionMatch[1];

			const optionMatchValue = optionMatch[2].replace(/\n|\t/g, ' ').replace(/(?:`|')/g, '"');

			if (optionKey === 'pregenerate') {
				contentOptions[optionKey] += ` ${optionMatchValue}`;

			} else if (['components', 'variables', 'plainSelectors'].includes(optionKey)) {
				contentOptions[optionKey] = {
					...contentOptions[optionKey],
					...JSON.parse(optionMatchValue)
				};

			} else if (optionKey in this.contentOptionsProcessors) {
				contentOptions = {
					...contentOptions,
					...this.contentOptionsProcessors[optionKey](contentOptions, optionMatchValue)
				};
			}
		}

		return contentOptions;
	}

}
