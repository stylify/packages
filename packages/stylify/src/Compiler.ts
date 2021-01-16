import CssRecord from "./Compiler/CssRecord";
import SelectorProperties from "./Compiler/SelectorProperties";
import MacroMatch from "./Compiler/MacroMatch";
import EventsEmitter from "./EventsEmitter";

export default class Compiler {

	public cache: Record<string, any> = {
		processedSelectors: [],
		processedComponents: [],
		cssTree: {
			_: {}
		},
		componentsSelectorsDependencyTree: {}
	};

	public dev: Boolean = false;

	public macros: Record<string, any> = {};

	public helpers: Record<string, any> = {};

	public screens: Record<string, any> = {};

	public initialCss: string = '';

	public variables: Record<string, any> = {};

	public components: Record<string, any> = {};

	constructor(config: Record<string, any> = {}) {
		this.configure(config);
	}

	public configure(config: Record<string, any> = {}): Compiler {
		this.cache = config.cache || this.cache;
		this.dev = config.dev || this.dev;
		this.macros = Object.assign(this.macros, config.macros || {});
		this.helpers = Object.assign(this.helpers, config.helpers || {});
		this.variables = Object.assign(this.variables, config.variables || {});
		this.screens = Object.assign(this.screens, config.screens || {});
		this.initialCss = config.initialCss || '';
		this.components = Object.assign(this.components, config.components || {});

		for (let componentSelector in this.components) {
			this.addComponent(componentSelector, this.components[componentSelector]);
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

		if (this.cache.processedComponents.indexOf(selector) > -1) {
			return;
		}

		selectorDependencies.forEach((selectorDependency) => {
			if (!(selectorDependency in this.cache.componentsSelectorsDependencyTree)) {
				this.cache.componentsSelectorsDependencyTree[selectorDependency] = [];
			}

			if (this.cache.componentsSelectorsDependencyTree[selectorDependency].indexOf(selector) === -1) {
				this.cache.componentsSelectorsDependencyTree[selectorDependency].push(selector);
			}
		});

		this.cache.processedComponents.push(selector);

		return this;
	}

	public addMacro(re: string, callback: CallableFunction): Compiler {
		this.macros[re] = callback;
		return this;
	}

	public compile(content: string, generateCss: Boolean = true): Record<string, any> {
		let wasAnyCssGenerated = false;
		const classAttributeRe = new RegExp('class="([^"]+)"', 'igm');

		if (classAttributeRe.exec(content) !== null) {
			classAttributeRe.lastIndex = 0;
			let classAttributeMatch;
			let classAtributesMatchesString = '';

			while (classAttributeMatch = classAttributeRe.exec(content)) {
				classAtributesMatchesString += ' ' + classAttributeMatch[1];
			}

			content = classAtributesMatchesString;
		}

		for (let macroKey in this.macros) {
			const macroRe = new RegExp('(?:([^\. ]+):)?(?<!-)\\b' + macroKey, 'igm');
			let macroMatches;

			while (macroMatches = macroRe.exec(content)) {
				if (this.cache.processedSelectors.indexOf(macroMatches[0]) > -1) {
					continue;
				}

				wasAnyCssGenerated = true;
				const macroMatch = new MacroMatch(macroMatches, Object.keys(this.screens));

				this.addCssRecord(
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

		const notProcessedComponentsSelectorsDependencies =
			Object.keys(this.cache.componentsSelectorsDependencyTree).filter((componentSelectorDependencyKey) => {
				return this.cache.processedSelectors.indexOf(componentSelectorDependencyKey) === -1;
			});

		if (notProcessedComponentsSelectorsDependencies.length) {
			this.compile(notProcessedComponentsSelectorsDependencies.join(' '), generateCss);
		}

		return {
			css: generateCss ? this.generateCss() : null,
			cache: this.cache,
			wasAnyCssGenerated: wasAnyCssGenerated
		}
	}

	public generateCss(): string {
		let css = this.initialCss;

		for (let screenKey in this.cache.cssTree) {
			let screenCss = '';
			const screenOpen = screenKey === '_' ? '' : this.screens[screenKey] + '{'
			const screenClose = '}';

			for (let selector in this.cache.cssTree[screenKey]) {
				screenCss += this.cache.cssTree[screenKey][selector].compile({
					minimize: this.dev === false
				});
			};

			css += screenKey === '_' ? screenCss : screenOpen + screenCss + screenClose;
		};

		return css.trim();
	}

	public addCssRecord(macroMatch: MacroMatch, selectorProperties): Compiler {
		const macroResult = selectorProperties.properties;
		const screen = macroMatch.screen;
		const selector = macroMatch.selector;

		if (typeof this.cache.cssTree[screen] === 'undefined') {
			this.cache.cssTree[screen] = {};
		}

		if (!(selector in this.cache.cssTree[screen])) {
			this.cache.cssTree[screen][selector] = new CssRecord();

			if (macroMatch.pseudoClasses.length > 0) {
				macroMatch.pseudoClasses.forEach((pseudoClass) => {
					this.cache.cssTree[screen][selector].addSelector(selector, pseudoClass);
				});
			} else {
				this.cache.cssTree[screen][selector].addSelector(selector);
			}

			for (let property in macroResult) {
				this.cache.cssTree[screen][selector].addProperty(property, macroResult[property]);
			}
		}

		if (selector in this.cache.componentsSelectorsDependencyTree) {
			this.cache.componentsSelectorsDependencyTree[selector].forEach((componentSelector) => {
				this.cache.cssTree[screen][selector].addSelector(componentSelector);
			});
		}

		this.cache.processedSelectors.push(macroMatch.fullMatch);
		return this;
	}

}
