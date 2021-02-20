import { EventsEmitter } from ".";
import { CompilationResult, MacroMatch, SelectorProperties } from './Compiler/index';

export default class Compiler {

	private PREGENERATE_MATCH_REG_EXP: RegExp = new RegExp('stylify-pregenerate:([\\S ]*\\b)', 'igm');

	public classMatchRegExp: RegExp = null;

	public mangleSelectors: Boolean = false;

	public dev: Boolean = false;

	public macros: Record<string, any> = {};

	public helpers: Record<string, any> = {};

	public screens: Record<string, any> = {};

	public screensKeys: string[] = [];

	public variables: Record<string, any> = {};

	public components: Record<string, any> = {};

	public pregenerate: string = '';

	public componentsSelectorsMap = {};

	constructor(config: Record<string, any> = {}) {
		this.configure(config);
	}

	public configure(config: Record<string, any> = {}): Compiler {
		this.dev = config.dev || this.dev;
		this.macros = Object.assign(this.macros, config.macros || {});

		this.helpers = Object.assign(this.helpers, config.helpers || {});
		this.variables = Object.assign(this.variables, config.variables || {});
		this.screens = Object.assign(this.screens, config.screens || {});
		this.screensKeys = Object.keys(this.screens);
		this.components = Object.assign(this.components, config.components || {});
		this.mangleSelectors = config.mangleSelectors || this.mangleSelectors;
		this.pregenerate += Array.isArray(config.pregenerate) ? config.pregenerate.join(' ') : config.pregenerate;

		this.classMatchRegExp = new RegExp(
			'(?:' + ['class', 's-pregenerate'].concat(config.classRegExpClassAttributes || []).join('|') + ')="([^"]+)"', 'igm'
		);

		for (let componentSelector in config.components) {
			this.addComponent(componentSelector, config.components[componentSelector]);
		}

		EventsEmitter.dispatch('stylify:compiler:configured', {
			compiler: this
		});

		return this;
	}

	public addComponent(selector: string, selectorDependencies: string[] | string): Compiler {
		if (typeof selectorDependencies === 'string') {
			selectorDependencies = selectorDependencies
				.replaceAll(/\s/ig, ' ')
				.split(' ')
				.filter(selector => selector.trim().length);
		}

		selectorDependencies.forEach((selectorDependency) => {
			if (!(selectorDependency in this.componentsSelectorsMap)) {
				this.componentsSelectorsMap[selectorDependency] = [];
			}

			if (this.componentsSelectorsMap[selectorDependency].indexOf(selector) === -1) {
				this.componentsSelectorsMap[selectorDependency].push(selector);
			}
		});

		return this;
	}

	public addMacro(re: string, callback: CallableFunction): Compiler {
		this.macros[re] = callback;
		return this;
	}

	// TODO cloning into the separate method on the backend
	// TODO serializing method for cache must be available on the frontend too
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
			componentsSelectorsMap: this.componentsSelectorsMap,
			variables: this.variables
		});

 		while (classAttributeMatch = this.classMatchRegExp.exec(content)) {
			classAtributesMatchesString += ' ' + classAttributeMatch[1];
		}

		if (classAtributesMatchesString.length) {
 			while (pregenerateMatch = this.PREGENERATE_MATCH_REG_EXP.exec(content)) {
				classAtributesMatchesString += ' ' + pregenerateMatch[1];
			}
			content = classAtributesMatchesString + ' ' + this.pregenerate;
		}

		content += ' ' + this.pregenerate;
		this.pregenerate = '';

		content = content.split(' ').filter((value, index, self) => self.indexOf(value) === index).join(' ');

		for (let macroKey in this.macros) {

			const macroRe = new RegExp('(?:([^\. ]+):)?(?<!-)\\b' + macroKey, 'igm');
			let macroMatches;

			while (macroMatches = macroRe.exec(content)) {
				if (macroMatches[0] in compilationResult.processedSelectors) {
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
			}
		};

		if (Object.keys(this.componentsSelectorsMap).length) {
			const notProcessedComponentsSelectorsDependencies =
				Object.keys(this.componentsSelectorsMap).filter((componentSelectorDependencyKey) => {
					return !(componentSelectorDependencyKey in compilationResult.processedSelectors);
				});

			if (notProcessedComponentsSelectorsDependencies.length) {
				compilationResult = this.compile(
					notProcessedComponentsSelectorsDependencies.join(' '), compilationResult
				);
			}

			compilationResult.bindComponentsSelectors(this.componentsSelectorsMap);
			this.componentsSelectorsMap = {};
		}

		return compilationResult;
	}

}
