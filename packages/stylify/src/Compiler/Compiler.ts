import { CompilationResult, MacroMatch, SelectorProperties, SelectorsListInterface } from '.';

export interface SerializedCompilerInterface {
	selectorsList: SelectorsListInterface
}

export interface CompilerConfigInterface {
	dev?: boolean,
	macros?: Record<string, CallableFunction>,
	helpers?: Record<string, CallableFunction>,
	variables?: Record<string, string | number>,
	screens?: Record<string, string|CallableFunction>,
	mangleSelectors?: boolean,
	pregenerate?: string[]|string,
	components?: Record<string, string|string[]>,
	onPrepareCompilationResult?: CallableFunction,
	contentOptionsProcessors?: Record<string, CallableFunction>,
	ignoredElements?: string[]
}

export interface CompilerContentOptionsInterface {
	pregenerate: string,
	components: Record<string, any>
}

export interface ComponentsInterface {
	selectors: string[],
	processed: boolean
}

export class Compiler {

	private readonly CONTENT_OPTIONS_REG_EXP = new RegExp('@stylify-(\\w+)\\[([^\\[\\]]+|\\n+)\\]');

	private ignoredElementsRegExp: RegExp = null;

	public contentOptionsProcessors: Record<string, CallableFunction> = {};

	public onPrepareCompilationResult: CallableFunction = null;

	public mangleSelectors = false;

	public dev = false;

	public macros: Record<string, any> = {};

	public helpers: Record<string, any> = {};

	public screens: Record<string, any> = {};

	public variables: Record<string, any> = {};

	public components: Record<string, ComponentsInterface> = {};

	public pregenerate = '';

	public ignoredElements = ['head', 'script', 'style', 'stylify-ignore'];

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
			return `<${element}[\\s\\S]*?>[\\s\\S]*?<\\/${element}>`;
		});

		this.ignoredElementsRegExp = new RegExp(ignoredElements.join('|'), 'ig');
		this.onPrepareCompilationResult = config.onPrepareCompilationResult || this.onPrepareCompilationResult;

		for (const componentSelector in config.components) {
			this.addComponent(componentSelector, config.components[componentSelector]);
		}

		return this;
	}

	public addComponent(selector: string, selectorDependencies: string|string[]): Compiler {
		if (selector in this.components) {
			return;
		}

		selectorDependencies = typeof selectorDependencies === 'string'
			? selectorDependencies.replace(/\s/ig, ' ')
			: selectorDependencies.join(' ');

		selectorDependencies = selectorDependencies.split(' ').filter((selector: string): boolean => {
			return selector.trim().length > 0;
		});

		this.components[selector] = {
			selectors: selectorDependencies,
			processed: false
		};

		return this;
	}


	public addMacro(re: string, callback: CallableFunction): Compiler {
		this.macros[re] = callback;
		return this;
	}

	public rewriteSelectors(compilationResult: CompilationResult, content: string): string {
		const placeholderTextPart = '__STYLIFY_PLACEHOLDER__';
		const contentPlaceholders: Record<string, any> = {};

		const placeholderInserter = (matched: string) => {
			const placeholderKey = `${placeholderTextPart}${Object.keys(contentPlaceholders).length}`;
			contentPlaceholders[placeholderKey] = matched;
			return placeholderKey;
		};

		content = content
			.replace(new RegExp(this.ignoredElementsRegExp.source, 'g'), (matched: string) => {
				return placeholderInserter(matched);
			})
			.replace(new RegExp(this.CONTENT_OPTIONS_REG_EXP.source, 'g'), (matched: string) => {
				return placeholderInserter(matched);
			});

		const selectorsListKeys = Object.keys(compilationResult.selectorsList);
		const sortedSelectorsListKeys = [...selectorsListKeys, ...Object.keys(compilationResult.componentsList)]
			.sort((a: string, b: string): number => {
				return b.length - a.length;
			});

		for (const selector of sortedSelectorsListKeys) {
			const regExpSelector = selector.replace(/[.*+?^${}()|[\]\\]/ig, '\\$&');
			content = content.replace(
				new RegExp(`(?:[\\s"'{,\`]+|^)${regExpSelector}(?:[\\s"'{,\`]+|$)`, 'ig'),
				(matched: string): string => {
					return matched.replace(
						selector,
						selectorsListKeys.includes(selector)
							? compilationResult.selectorsList[selector].mangledSelector
							: compilationResult.componentsList[selector]
					);
				}
			);
		}

		for (const placeholderKey in contentPlaceholders) {
			content = content.replace(placeholderKey, contentPlaceholders[placeholderKey]);
		}

		return content;
	}

	public compile(content: string, compilationResult: CompilationResult = null): CompilationResult {
		if (!compilationResult) {
			compilationResult = this.prepareCompilationResult();
		}

		this.prepareCompilationResult(compilationResult);
		const { components, pregenerate } = this.getOptionsFromContent(content);

		this.configure({
			components: components || {},
			pregenerate: pregenerate || ''
		});

		content = `${this.pregenerate} ${content}`;
		this.pregenerate = '';

		content = content
			.replace(new RegExp(this.ignoredElementsRegExp.source, 'g'), '')
			.replace(new RegExp(this.CONTENT_OPTIONS_REG_EXP.source, 'g'), '')
			.replace(/\r\n|\r|\n|\t/ig, ' ')
			.replace(/&amp;/ig, '&');

		if (compilationResult && Object.keys(compilationResult.selectorsList).length) {
			content = content.replace(/s\d+/ig, (matched) => {
				return matched in compilationResult.selectorsList
					? compilationResult.selectorsList[matched].mangledSelector
					: matched;
			});
		}

		const selectorsComponentsMap = {};

		Object.keys(this.components)
			.filter((element): boolean => {
				return this.components[element].processed === false;
			})
			.forEach((notProcessedComponentsSelector) => {
				if (!content.match(new RegExp(`(?:[ "'{,\`]|^)${notProcessedComponentsSelector}\\b`, 'ig'))) {
					return;
				}

				const componentSelectors = this.components[notProcessedComponentsSelector].selectors;
				content += ` ${componentSelectors.join(' ')}`;

				componentSelectors.forEach((componentDependencySelector: string): void => {
					if (! (componentDependencySelector in selectorsComponentsMap)) {
						selectorsComponentsMap[componentDependencySelector] = [];
					}

					selectorsComponentsMap[componentDependencySelector].push(notProcessedComponentsSelector);
				});

				this.components[notProcessedComponentsSelector].processed = true;
			});

		this.processMacros(content, compilationResult);

		if (Object.keys(selectorsComponentsMap).length) {
			compilationResult.bindComponentsSelectors(selectorsComponentsMap);
		}

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
		return CompilationResult.deserialize(typeof data === 'string' ? JSON.parse(data) : data);
	}

	private prepareCompilationResult(compilationResult: CompilationResult = null): CompilationResult
	{
		if (!compilationResult) {
			compilationResult = new CompilationResult();
		}

		compilationResult.configure({
			dev: this.dev,
			mangleSelectors: this.mangleSelectors,
			variables: this.variables
		});

		if (this.onPrepareCompilationResult) {
			this.onPrepareCompilationResult(compilationResult);
		}

		return compilationResult;
	}

	private processMacros(content: string, compilationResult: CompilationResult = null) {
		for (const macroKey in this.macros) {
			const macroRe = new RegExp(`(?:([\\w-:&|]+):)?(?<!-)\\b${macroKey}`, 'igm');

			let macroMatches: string[];

			while ((macroMatches = macroRe.exec(content))) {
				const fullMatch = macroMatches[0];

				if (!(fullMatch in compilationResult.selectorsList)) {
					const macroMatch = new MacroMatch(macroMatches, this.screens);
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

					compilationResult.addCssRecord(macroMatch, selectorProperties);
				}

				compilationResult.selectorsList[fullMatch].shouldBeGenerated = true;
			}
		}
	}

	public getOptionsFromContent(content: string): CompilerContentOptionsInterface {
		let contentOptions: CompilerContentOptionsInterface = {
			pregenerate: '',
			components: {}
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

			} else if (optionKey === 'components') {
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
