// @ts-nocheck

import CompilationResult from './CompilationResult';
import SelectorProperties from './SelectorProperties';
import MacroMatch from './MacroMatch';
import { EventsEmitter } from '../';

export default class Compiler {

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

		if (typeof config.pregenerate !== 'undefined') {
			this.pregenerate += Array.isArray(config.pregenerate) ? config.pregenerate.join(' ') : config.pregenerate;
		}

		this.classMatchRegExp = new RegExp(
			'(?:' + ['class', 's-pregenerate']
				.concat(config.classRegExpClassAttributes || [])
				.join('|') + ')="([^"]+)"', 'igm'
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
			content = classAtributesMatchesString;
		}

		content += ' ' + this.pregenerate;
		this.pregenerate = '';

		content = content.replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>|<style[\s\S]*?>[\s\S]*?<\/style>/ig, '');
		content = content.split(' ').filter((value, index, self) => self.indexOf(value) === index).join(' ');

		for (const macroKey in this.macros) {

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
		}

		// TODO lazyload components - should be generated only when used
		if (Object.keys(this.componentsSelectorsMap).length) {
			const componentsSelectorsMap = Object.assign({}, this.componentsSelectorsMap);
			this.componentsSelectorsMap = {};

			const notProcessedComponentsSelectorsDependencies =
				Object.keys(componentsSelectorsMap).filter((componentSelectorDependencyKey) => {
					return !(componentSelectorDependencyKey in compilationResult.processedSelectors);
				});

			if (notProcessedComponentsSelectorsDependencies.length) {
				compilationResult = this.compile(
					notProcessedComponentsSelectorsDependencies.join(' '), compilationResult
				);
				compilationResult.bindComponentsSelectors(componentsSelectorsMap);
			}
		}

		return compilationResult;
	}

	public hydrate(data: Record<string, any>): void {
		const newComponentsSelectorsMap = {};

		Object.keys(this.componentsSelectorsMap).forEach(selector => {
			const componentsSelectors = this.componentsSelectorsMap[selector].filter(componentSelector => {
				return !(componentSelector in data.processedSelectors);
			});

			if (!componentsSelectors.length) {
				return;
			}

			newComponentsSelectorsMap[selector] = componentsSelectors;
		});

		this.componentsSelectorsMap = newComponentsSelectorsMap;
	}

	public createResultFromSerializedData(data: string|Record<string, any>): CompilationResult {
		return CompilationResult.deserialize(typeof data === 'string' ? JSON.parse(data) : data);
	}

}
