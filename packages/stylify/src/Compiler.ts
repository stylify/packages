import CssRecord from "./Compiler/CssRecord";
import SelectorProperties from "./Compiler/SelectorProperties";
import MacroMatch from "./Compiler/MacroMatch";

export default class Compiler {

	private cache: Record<string, any> = {
		processedSelectors: [],
		processedComponents: [],
		cssTree: {
			_: {}
		},
		componentsSelectorsDependencyTree: {}
	};

	private config: Record<string, any> = {
		dev: false,
		macros: {},
		helpers: {},
		variables: {},
		screens: {},
		initialCss: ''
	};

	constructor(config: Record<string, any> = {}) {
		this.configure(config);
	}

	public configure(config: Record<string, any> = {}): Compiler {
		this.cache = config.cache || this.cache;
		this.config.dev = config.dev || this.config.dev;
		this.config.macros = Object.assign(this.config.macros, config.macros || {});
		this.config.helpers = Object.assign(this.config.helpers, config.helpers || {});
		this.config.variables = Object.assign(this.config.variables, config.variables || {});
		this.config.screens = Object.assign(this.config.screens, config.screens || {});
		this.config.initialCss = config.initialCss || '';

		const configComponents = config.components || {};

		for (let componentSelector in configComponents) {
			this.addComponent(componentSelector, configComponents[componentSelector]);
		}

		return this;
	}

	public getConfig(): Record<string, any> {
		return this.config;
	}

	public addComponent(selector: string, selectorsDependencies: string[]): Compiler {
		if (this.cache.processedComponents.indexOf(selector) > -1) {
			return;
		}

		selectorsDependencies.forEach((selectorDependency) => {
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
		this.config.macros[re] = callback;
		return this;
	}

	public compile(content: string, generateCss: Boolean = true): Record<string, any> {
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

		for (let macroKey in this.config.macros) {
			const macroRe = new RegExp('(?:([^\. ]+):)?(?<!-)\\b' + macroKey, 'igm');
			//const macroRe = new RegExp('(?:([^\. ]+):)?(?<!-)' + macroKey, 'igm');
			let macroMatches;

			while (macroMatches = macroRe.exec(content)) {
				if (this.cache.processedSelectors.indexOf(macroMatches[0]) > -1) {
					continue;
				}

				const macroMatch = new MacroMatch(macroMatches, Object.keys(this.config.screens));

				this.addCssRecord(
					macroMatch,
					this.config.macros[macroKey].call(
						{
							dev: this.config.dev,
							variables: this.config.variables,
							helpers: this.config.helpers
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
			this.compile(notProcessedComponentsSelectorsDependencies.join(' '), generateCss)
		}

		return {
			css: generateCss ? this.generateCss() : null,
			cache: this.cache
		}
	}

	public setCache(cache): Compiler {
		this.cache = cache;
		return this;
	}

	public getCache(): Record<string, any> {
		return this.cache;
	}

	public generateCss(): string {
		let css = this.config.initialCss;

		for (let screenKey in this.cache.cssTree) {
			let screenCss = '';
			const screenOpen = screenKey === '_' ? '' : this.config.screens[screenKey] + '{'
			const screenClose = '}';

			for (let selector in this.cache.cssTree[screenKey]) {
				screenCss += this.cache.cssTree[screenKey][selector].compile();
			};

			css += screenKey === '_' ? screenCss : screenOpen + screenCss + screenClose;
		};

		return css;
	}

	public addCssRecord(macroMatch, selectorProperties): Compiler {
		const macroResult = selectorProperties.getProperties();
		const screen = macroMatch.getScreen();
		const selector = macroMatch.getSelector();

		if (typeof this.cache.cssTree[screen] === 'undefined') {
			this.cache.cssTree[screen] = {};
		}

		if (!(selector in this.cache.cssTree[screen])) {
			this.cache.cssTree[screen][selector] = new CssRecord();

			if (macroMatch.hasPseudoClasses()) {
				macroMatch.getPseudoClasses().forEach((pseudoClass) => {
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

		this.cache.processedSelectors.push(macroMatch.getFullMatch());
		return this;
	}

}
