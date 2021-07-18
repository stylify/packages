import { CompilationResult, SelectorsListInterface } from './CompilationResult';
import SelectorProperties from './SelectorProperties';
import MacroMatch from './MacroMatch';
import EventsEmitter from '../EventsEmitter';

export interface SerializedCompilerInterface {
	selectorsList: SelectorsListInterface
}

export interface CompilerConfigInterface {
	dev: boolean,
	macros: Record<string, CallableFunction>,
	helpers: Record<string, CallableFunction>,
	variables: Record<string, string | number>,
	screens: Record<string, string>,
	mangleSelectors: boolean,
	selectorsAttributes: string[],
	pregenerate: string[]|string,
	components: Record<string, string>
}

class Compiler {

	private PREGENERATE_MATCH_REG_EXP = new RegExp('stylify-pregenerate:([\\S ]*\\b)', 'igm');

	public classMatchRegExp: RegExp = null;

	public mangleSelectors = false;

	public dev = false;

	public macros: Record<string, any> = {};

	public helpers: Record<string, any> = {};

	public screens: Record<string, any> = {};

	public screensKeys: string[] = [];

	public variables: Record<string, any> = {};

	public components: Record<string, any> = {};

	public pregenerate = '';

	public componentsSelectorsRegExp: RegExp = null;

	constructor(config: Record<string, any> = {}) {
		this.configure(config);
	}

	public configure(config: Partial<CompilerConfigInterface> = {}): Compiler {
		this.dev = typeof config.dev === 'undefined' ? this.dev : config.dev;
		this.macros = Object.assign(this.macros, config.macros || {});

		this.helpers = Object.assign(this.helpers, config.helpers || {});
		this.variables = Object.assign(this.variables, config.variables || {});
		this.screens = Object.assign(this.screens, config.screens || {});
		this.screensKeys = Object.keys(this.screens);
		this.mangleSelectors = typeof config.mangleSelectors === 'undefined'
			? this.mangleSelectors
			: config.mangleSelectors;

		if (typeof config.pregenerate !== 'undefined') {
			this.pregenerate += Array.isArray(config.pregenerate) ? config.pregenerate.join(' ') : config.pregenerate;
		}

		this.classMatchRegExp = new RegExp(
			'(?:' + ['class', 's-pregenerate'].concat(config.selectorsAttributes || []).join('|') + ')="([^"]+)"', 'igm'
		);

		for (const componentSelector in config.components) {
			this.addComponent(componentSelector, config.components[componentSelector]);
		}

		EventsEmitter.dispatch('stylify:compiler:configured', {
			compiler: this
		});

		return this;
	}

	public addComponent(selector: string, selectorDependencies: string[] | string): Compiler {
		if (selector in this.components) {
			return;
		}

		if (typeof selectorDependencies === 'string') {
			selectorDependencies = selectorDependencies
				.replace(/\s/ig, ' ')
				.split(' ')
				.filter((selector: string): boolean => {
					return selector.trim().length > 0;
				});
		}

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

	// TODO cloning into the separate method on the backend
	public compile(content: string, compilationResult: CompilationResult = null): CompilationResult {
		this.classMatchRegExp.lastIndex = 0;
		let classAttributeMatch;
		let classAtributesMatchesString = '';
		let pregenerateMatch;

		if (!compilationResult) {
			compilationResult = new CompilationResult();
		}

		compilationResult.configure({
			dev: this.dev,
			screens: this.screens,
			mangleSelectors: this.mangleSelectors,
			variables: this.variables
		});

		while ((classAttributeMatch = this.classMatchRegExp.exec(content))) {
			classAtributesMatchesString += ` ${classAttributeMatch[1] as string}`;
		}

		if (classAtributesMatchesString.length) {
			while ((pregenerateMatch = this.PREGENERATE_MATCH_REG_EXP.exec(content))) {
				classAtributesMatchesString += ` ${pregenerateMatch[1] as string}`;
			}

			content = classAtributesMatchesString;
		}

		content += ' ' + this.pregenerate;
		this.pregenerate = '';

		const notProcessedComponentsSelectors = Object.keys(this.components).filter((element): boolean => {
			return this.components[element].processed === false;
		});

		const processedComponentsSelectors = {};

		if (notProcessedComponentsSelectors.length) {
			let componentMatches;

			for (const notProcessedComponentsSelector of notProcessedComponentsSelectors) {
				const componentSelectorRegExp = new RegExp(
					'(?:^|)(' + notProcessedComponentsSelector + ')(?:$| )', 'igm'
				);

				while ((componentMatches = componentSelectorRegExp.exec(content))) {
					const componentSelector = componentMatches[1];
					const componentSelectors = this.components[componentSelector].selectors;
					content += ` ${componentSelectors.join(' ') as string}`;
					processedComponentsSelectors[componentSelector] = componentSelectors;
					this.components[componentSelector].processed = true;
				}
			}

		}

		this.processMacros(content, compilationResult);

		const processedComponentsSelectorsKeys = Object.keys(processedComponentsSelectors);
		if (processedComponentsSelectorsKeys.length) {
			const selectorsComponentsMap = {};

			processedComponentsSelectorsKeys.forEach((componentSelector) => {
				processedComponentsSelectors[componentSelector].forEach((componentDependencySelector) => {
					if (! (componentDependencySelector in selectorsComponentsMap)) {
						selectorsComponentsMap[componentDependencySelector] = [];
					}

					selectorsComponentsMap[componentDependencySelector].push(componentSelector);
				});
			});

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

	public createResultFromSerializedData(data: string|Record<string, any>): CompilationResult {
		return CompilationResult.deserialize(typeof data === 'string' ? JSON.parse(data) : data);
	}

	private processMacros(content: string, compilationResult: CompilationResult = null) {
		content = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<style[\s\S]*?>[\s\S]*?<\/style>/ig, '');

		if (compilationResult && Object.keys(compilationResult.mangledSelectorsMap).length) {
			content = content.replace(/s\d+/ig, (matched) => {
				return matched in compilationResult.mangledSelectorsMap
					? compilationResult.mangledSelectorsMap[matched]
					: matched;
			});
		}

		for (const macroKey in this.macros) {
			const macroRe = new RegExp('(?:([^. ]+):)?(?<!-)\\b' + macroKey, 'igm');

			let macroMatches: string[];

			while ((macroMatches = macroRe.exec(content))) {
				const fullMatch = macroMatches[0];
				const macroIsInSelectorsList = fullMatch in compilationResult.selectorsList;
				const macroIsProcessed = macroIsInSelectorsList && compilationResult.selectorsList[fullMatch].processed;

				if (macroIsInSelectorsList && macroIsProcessed) {
					continue;
				}

				const macroMatch = new MacroMatch(macroMatches, this.screensKeys);

				compilationResult.addCssRecord(
					macroMatch,
					this.macros[macroKey].call(
						{
							dev: this.dev,
							variables: this.variables,
							helpers: this.helpers
						},
						macroMatch,
						new SelectorProperties()
					)
				);

				if (macroIsInSelectorsList && !macroIsProcessed) {
					compilationResult.selectorsList[fullMatch].processed = true;
				}
			}
		}
	}

}

export { Compiler };

export default Compiler;
