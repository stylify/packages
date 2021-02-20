/**
 * @stylify/nuxt-module v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

import fs from 'fs';
import path from 'path';

/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

class CssRecord {
  constructor(selector = null, properties = {}, pseudoClases = []) {
    _defineProperty(this, "selectors", []);

    _defineProperty(this, "properties", {});

    _defineProperty(this, "pseudoClasses", []);

    if (selector) {
      if (typeof selector === 'string') {
        selector = [selector];
      }

      selector.forEach(selector => {
        this.addSelector(selector);
      });
    }

    this.properties = properties;
    this.pseudoClasses = pseudoClases;
  }

  addProperty(property, value) {
    if (!this.hasProperty(property)) {
      this.properties[property] = value;
    }
  }

  addSelector(selector, pseudoClass = null) {
    // TODO is this selector[0] and substr necessary?
    // selector = selector[0] + selector.substr(1).replace(/([^-_a-zA-Z\d])/g, '\\$1');
    selector = selector.replace(/([^-_a-zA-Z\d])/g, '\\$1');

    if (pseudoClass) {
      selector += ':' + pseudoClass;
    }

    if (!this.hasSelector(selector)) {
      this.selectors.push(selector);
    }
  }

  getSelector(selector) {
    return this.hasSelector(selector) ? this.selectors[this.selectors.indexOf(selector)] : null;
  }

  hasProperty(name) {
    return typeof this.properties[name] !== 'undefined';
  }

  hasSelector(selector) {
    return this.selectors.indexOf(selector) > -1;
  }

  compile(config = {}) {
    let minimize = config.minimize || false;
    const newLine = minimize ? '' : '\n';
    return this.selectors.map(selector => '.' + selector).join(',' + newLine) + '{' + newLine + Object.keys(this.properties).map(property => (minimize ? '' : '\t') + property + ':' + this.properties[property]).join(';' + newLine) + newLine + '}' + newLine;
  }

  serialize() {
    return {
      selectors: this.selectors.map(selector => {
        return selector.replace(/\\([^-_a-zA-Z\d])/g, '$1');
      }),
      properties: this.properties,
      pseudoClasses: this.pseudoClasses
    };
  }

  static deserialize(data) {
    const cssRecord = new CssRecord(null, data.properties, data.pseudoClasses);
    cssRecord.selectors = data.selectors;
    return cssRecord;
  }

  hydrate(data) {
    data.selectors.forEach(selector => {
      this.addSelector(selector);
    });
    this.pseudoClasses = this.pseudoClasses.concat(data.pseudoClasses.filter(pseudoClass => this.pseudoClasses.indexOf(pseudoClass) === -1));
    Object.keys(data.properties).forEach(property => {
      this.addProperty(property, data.properties[property]);
    });
  }

}

class CompilationResult {
  constructor(config = {}) {
    _defineProperty(this, "MATCH_VARIABLE_REG_EXP", /\$([\w-_]+)/g);

    _defineProperty(this, "changed", false);

    _defineProperty(this, "mangleSelectors", false);

    _defineProperty(this, "dev", false);

    _defineProperty(this, "screens", {});

    _defineProperty(this, "processedSelectors", {});

    _defineProperty(this, "cssTree", {
      '_': {}
    });

    _defineProperty(this, "variables", {});

    _defineProperty(this, "lastBuildInfo", null);

    _defineProperty(this, "setBuildInfo", (data = null) => {
      if (data === null || this.lastBuildInfo === null || this.changed === true && this.lastBuildInfo.completed === true) {
        this.lastBuildInfo = {
          processedSelectors: [],
          processedComponents: [],
          completed: false
        };
      }

      if (data === null || !this.dev) {
        return;
      }

      this.lastBuildInfo.processedComponents = this.lastBuildInfo.processedComponents.concat(data.processedComponents || []);
      this.lastBuildInfo.processedSelectors = this.lastBuildInfo.processedSelectors.concat(data.processedSelectors || []);
    });

    this.setBuildInfo(null);
    this.configure(config);
  }

  configure(config = {}) {
    this.dev = config.dev || this.dev;
    this.screens = config.screens || this.screens; // TODO always generate short id?

    this.mangleSelectors = config.mangleSelectors || this.mangleSelectors;
    this.variables = config.variables; // TODO block keys sorting - keep order given by developer

    Object.keys(this.screens).forEach(screenKey => {
      this.cssTree[screenKey] = this.cssTree[screenKey] || {};
    });
  }

  generateCss() {
    let css = ''; // Přenést tuto funkci do generateCssForScreens
    // Vrátit objekt s csskem
    // Mergnout, trimnout, vrátit string

    for (let screenKey in this.cssTree) {
      if (Object.keys(this.cssTree[screenKey]).length === 0) {
        continue;
      }

      let screenCss = '';
      const screenOpen = screenKey === '_' ? '' : this.screens[screenKey] + '{';
      const screenClose = '}';

      for (let selector in this.cssTree[screenKey]) {
        screenCss += this.cssTree[screenKey][selector].compile({
          minimize: !this.dev
        });
      }
      css += screenKey === '_' ? screenCss : screenOpen + screenCss + screenClose;
    }
    this.changed = false;
    this.lastBuildInfo.completed = true;
    return css.trim();
  } // Generate css for each screen
  // Možné potom použít pro linky, css se načte separátně jako soubor


  generateCssForScreens() {
    this.changed = false;
    this.lastBuildInfo.completed = true;
    return {
      'screen': 'css'
    };
  }

  addCssRecord(macroMatch, selectorProperties) {
    const macroResult = selectorProperties.properties;
    const screen = macroMatch.screen;
    const selector = macroMatch.selector;
    const mangledSelectorId = this.getUniqueSelectorId();

    if (typeof this.cssTree[screen] === 'undefined') {
      this.cssTree[screen] = {};
    }

    if (selector in this.cssTree[screen]) {
      return;
    }

    const newCssRecord = new CssRecord();
    newCssRecord.pseudoClasses = macroMatch.pseudoClasses;
    const selectorToAdd = this.mangleSelectors ? mangledSelectorId : selector;

    for (let property in macroResult) {
      const propertyValue = macroResult[property].replace(this.MATCH_VARIABLE_REG_EXP, (match, substring) => {
        return this.variables[substring];
      });
      newCssRecord.addProperty(property, propertyValue);
    }

    this.cssTree[screen][selector] = newCssRecord;
    this.addSelectorIntoCssTree(screen, selector, selectorToAdd);
    this.changed = true;
    this.setBuildInfo({
      processedSelectors: [selector]
    });
    this.processedSelectors[macroMatch.fullMatch] = mangledSelectorId;
  }

  bindComponentsSelectors(componentsSelectorsMap) {
    const processedComponents = [];
    Object.keys(this.cssTree).forEach(screen => {
      Object.keys(this.cssTree[screen]).forEach(selector => {
        if (selector in componentsSelectorsMap) {
          componentsSelectorsMap[selector].forEach(componentSelector => {
            if (!(componentSelector in this.processedSelectors)) {
              this.processedSelectors[componentSelector] = this.getUniqueSelectorId();
            }

            let selectorToAdd = this.mangleSelectors ? this.processedSelectors[componentSelector] : componentSelector;

            if (processedComponents.indexOf(componentSelector) === -1) {
              processedComponents.push(componentSelector);
            }

            this.addSelectorIntoCssTree(screen, selector, selectorToAdd);
          });
        }
      });
    });
    this.setBuildInfo({
      processedComponents: processedComponents
    });
  }

  addSelectorIntoCssTree(screen, selector, selectorToAdd) {
    const cssRecord = this.cssTree[screen][selector];

    if (cssRecord.pseudoClasses.length > 0) {
      cssRecord.pseudoClasses.forEach(pseudoClass => {
        cssRecord.addSelector(selectorToAdd, pseudoClass);
      });
      return;
    }

    cssRecord.addSelector(selectorToAdd);
  }

  serialize() {
    const serializedCompilationResult = {
      mangleSelectors: this.mangleSelectors,
      dev: this.dev,
      screens: this.screens,
      processedSelectors: this.processedSelectors,
      cssTree: {},
      variables: this.variables
    };
    Object.keys(this.cssTree).forEach(screen => {
      serializedCompilationResult.cssTree[screen] = {};
      Object.keys(this.cssTree[screen]).forEach(selector => {
        serializedCompilationResult.cssTree[screen][selector] = this.cssTree[screen][selector].serialize();
      });
    });
    return serializedCompilationResult;
  }

  static deserialize(data) {
    const compilationResult = new CompilationResult({
      dev: data.dev,
      screens: data.screens,
      variables: data.variables,
      mangleSelectors: data.mangleSelectors
    });
    compilationResult.processedSelectors = data.processedSelectors;
    Object.keys(data.cssTree).forEach(screen => {
      Object.keys(data.cssTree[screen]).forEach(selector => {
        const serializedSelectorData = data.cssTree[screen][selector];
        compilationResult.cssTree[screen][selector] = new CssRecord(serializedSelectorData.selectors, serializedSelectorData.properties, serializedSelectorData.pseudoClasses);
      });
    });
    return compilationResult;
  } // Co když css bude vygenerované do souborů?
  // <style> element bude jen pro vygenerované věci z runtime?
  // Něco jako negeneruj dané selektory, protože jsou v externích souborech


  hydrate(data) {
    this.processedSelectors = Object.assign(this.processedSelectors, data.processedSelectors);
    Object.keys(data.cssTree).forEach(screen => {
      Object.keys(data.cssTree[screen]).forEach(selector => {
        const serializedSelectorData = data.cssTree[screen][selector];
        this.cssTree[screen][selector].hydrate(serializedSelectorData);
      });
    });
  }

  getUniqueSelectorId() {
    return 's' + Object.keys(this.processedSelectors).length;
  }

}

class MacroMatch {
  constructor(match, screensKeys) {
    _defineProperty(this, "fullMatch", null);

    _defineProperty(this, "screenAndPseudoClassesMatch", null);

    _defineProperty(this, "selector", null);

    _defineProperty(this, "screen", null);

    _defineProperty(this, "pseudoClasses", []);

    _defineProperty(this, "captures", []);

    this.fullMatch = match[0];
    this.screenAndPseudoClassesMatch = match[1] || null;
    this.selector = this.fullMatch;
    this.screen = '_';
    this.pseudoClasses = [];
    match.splice(0, 2);
    this.captures = match.filter(matchToFilter => typeof matchToFilter !== 'undefined');

    if (this.screenAndPseudoClassesMatch) {
      const screenAndPseudoClassesMatchArray = this.screenAndPseudoClassesMatch.split(':');

      if (screensKeys.indexOf(screenAndPseudoClassesMatchArray[0]) > -1) {
        this.screen = screenAndPseudoClassesMatchArray[0];
        screenAndPseudoClassesMatchArray.shift();
      }

      this.pseudoClasses = screenAndPseudoClassesMatchArray;
    }
  }

  hasCapture(index) {
    return typeof this.captures[index] !== 'undefined';
  }

  getCapture(index, defaultValue = '') {
    return this.hasCapture(index) ? this.captures[index].replace(/__/g, ' ') : defaultValue;
  }

}

class SelectorProperties {
  constructor() {
    _defineProperty(this, "properties", {});
  }

  add(property, value) {
    this.properties[property] = value;
    return this;
  }

  addMultiple(properties) {
    let property; // Object assign?

    for (property in properties) {
      this.add(property, properties[property]);
    }

    return this;
  }

}

class Compiler {
  constructor(config = {}) {
    _defineProperty(this, "PREGENERATE_MATCH_REG_EXP", new RegExp('stylify-pregenerate:([\\S ]*\\b)', 'igm'));

    _defineProperty(this, "classMatchRegExp", null);

    _defineProperty(this, "mangleSelectors", false);

    _defineProperty(this, "dev", false);

    _defineProperty(this, "macros", {});

    _defineProperty(this, "helpers", {});

    _defineProperty(this, "screens", {});

    _defineProperty(this, "screensKeys", []);

    _defineProperty(this, "variables", {});

    _defineProperty(this, "components", {});

    _defineProperty(this, "pregenerate", '');

    _defineProperty(this, "componentsSelectorsMap", {});

    this.configure(config);
  }

  configure(config = {}) {
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

    this.classMatchRegExp = new RegExp('(?:' + ['class', 's-pregenerate'].concat(config.classRegExpClassAttributes || []).join('|') + ')="([^"]+)"', 'igm');

    for (let componentSelector in config.components) {
      this.addComponent(componentSelector, config.components[componentSelector]);
    }

    EventsEmitter$1.dispatch('stylify:compiler:configured', {
      compiler: this
    });
    return this;
  }

  addComponent(selector, selectorDependencies) {
    if (typeof selectorDependencies === 'string') {
      selectorDependencies = selectorDependencies.replaceAll(/\s/ig, ' ').split(' ').filter(selector => selector.trim().length);
    }

    selectorDependencies.forEach(selectorDependency => {
      if (!(selectorDependency in this.componentsSelectorsMap)) {
        this.componentsSelectorsMap[selectorDependency] = [];
      }

      if (this.componentsSelectorsMap[selectorDependency].indexOf(selector) === -1) {
        this.componentsSelectorsMap[selectorDependency].push(selector);
      }
    });
    return this;
  }

  addMacro(re, callback) {
    this.macros[re] = callback;
    return this;
  } // TODO cloning into the separate method on the backend
  // TODO serializing method for cache must be available on the frontend too


  compile(content, compilationResult = null) {
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

    for (let macroKey in this.macros) {
      const macroRe = new RegExp('(?:([^\. ]+):)?(?<!-)\\b' + macroKey, 'igm');
      let macroMatches;

      while (macroMatches = macroRe.exec(content)) {
        if (macroMatches[0] in compilationResult.processedSelectors) {
          continue;
        }

        const macroMatch = new MacroMatch(macroMatches, this.screensKeys);
        compilationResult.addCssRecord(macroMatch, this.macros[macroKey].call({
          dev: this.dev,
          variables: this.variables,
          helpers: this.helpers
        }, macroMatch, new SelectorProperties()));
      }
    }

    if (Object.keys(this.componentsSelectorsMap).length) {
      const componentsSelectorsMap = Object.assign({}, this.componentsSelectorsMap);
      this.componentsSelectorsMap = {};
      const notProcessedComponentsSelectorsDependencies = Object.keys(componentsSelectorsMap).filter(componentSelectorDependencyKey => {
        return !(componentSelectorDependencyKey in compilationResult.processedSelectors);
      });

      if (notProcessedComponentsSelectorsDependencies.length) {
        compilationResult = this.compile(notProcessedComponentsSelectorsDependencies.join(' '), compilationResult);
        compilationResult.bindComponentsSelectors(componentsSelectorsMap);
      }
    }

    return compilationResult;
  }

  hydrate(data) {
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

  createResultFromSerializedData(data) {
    return CompilationResult.deserialize(typeof data === 'string' ? JSON.parse(data) : data);
  }

}

class EventsEmitter {
  constructor() {
    _defineProperty(this, "eventListeners", {});

    _defineProperty(this, "addListener", (event, callback, id = null) => {
      if (!(event in this.eventListeners)) {
        this.eventListeners[event] = [];
      }

      const idExists = this.eventListeners[event].findIndex(item => item.id === id);

      if (idExists > -1) {
        return;
      }

      this.eventListeners[event].push({
        callback: callback,
        id: id
      });
      return this;
    });
  }

  dispatch(eventName, eventData = null) {
    if (!(eventName in this.eventListeners)) {
      return;
    }

    this.eventListeners[eventName].forEach(element => {
      element.callback(eventData);
    });
    return this;
  }

}

var EventsEmitter$1 = new EventsEmitter();

class SelectorsRewriter {
  constructor() {
    _defineProperty(this, "rewrite", (compilationResult, regExp, content) => {
      let classReplacementMap = {};
      let originalClassMatch;
      const selectorsMap = compilationResult.processedSelectors;
      regExp.lastIndex = 0;

      while (originalClassMatch = regExp.exec(content)) {
        let modifiedClassMatch = originalClassMatch[0];
        Object.keys(selectorsMap).forEach(selector => {
          modifiedClassMatch = modifiedClassMatch.replace(new RegExp(selector + '\\b', 'gi'), selectorsMap[selector]);
        });
        classReplacementMap[originalClassMatch[0]] = modifiedClassMatch;
      }

      Object.keys(classReplacementMap).forEach(classToReplace => {
        content = content.replace(classToReplace, classReplacementMap[classToReplace]);
      });
      regExp.lastIndex = 0;
      return content;
    });
  }

}

var SelectorsRewriter$1 = new SelectorsRewriter();

function Stylify(moduleOptions) {
	const CONFIG_FILE_NAME = 'stylify.config.js';
	const { nuxt } = this;

	let options = {
		configPath: CONFIG_FILE_NAME,
		embeddedCssLimit: 50,
		importStylify: true,
		importProfiler: false,
		// Extend config
		compiler: {},
		runtime: {}
	};
	options.compiler.dev = typeof nuxt.options.dev === "boolean" ? nuxt.options.dev : false;
	options.mangleSelectors = !options.compiler.dev;
	options = Object.assign(options, moduleOptions, nuxt.options.stylify);

	const configPath = nuxt.resolver.resolveAlias(options.configPath);
	if (options.compiler.dev && fs.existsSync(configPath)) {
		options = Object.assign(options, nuxt.resolver.requireModule(configPath));
		nuxt.options.watch.push(configPath);
	}

	const compiler = new Compiler(options.compiler);
	compiler.mangleSelectors = true;
	const process = (page, url = null) => {
		if (options.compiler.dev) {
			return;
		}
		const compilationResult = compiler.compile(page.html);
		const css = compilationResult.generateCss();
		JSON.stringify(compilationResult.serialize());
		const html = page.html.replace('</head>', '<script class="stylify-runtime-cache" type="application/json">' + JSON.stringify(compilationResult.serialize()) + '</script>\n<style id="stylify-css">' + css + '</style>\n</head>');
		page.html = SelectorsRewriter$1.rewrite(compilationResult, compiler.classMatchRegExp, html);
	};

	/*      const cssPath = nuxt.resolver.resolveAlias(
				path.join(nuxt.options.dir.assets, 'css', 'stylify.css')
			); */
	/* if (fs.existsSync(cssPath)) {
		nuxt.options.css.unshift(cssPath)
	} else {
		nuxt.options.css.unshift(path.resolve(__dirname, 'files', 'stylify.css'))
		} */

/* 	if (options.importStylify || options.compiler.dev) {
		this.addPlugin(path.resolve(__dirname, '..', 'node_modules', '@stylify', 'stylify', 'dist', 'stylify.native.js'));
	} */
	this.addPlugin({
		ssr: false,
		src: path.resolve(__dirname, 'plugin.js'),
		fileName: 'stylify.js',
		options: options
	});
	/* if (options.importProfiler || options.compiler.dev) {
		ModuleContainer.addPlugin(path.resolve(__dirname, '..', 'node_modules', '@stylify', 'stylify', 'dist', 'profiler.js'));
	} */
	/* nuxt.hook('build:done', (builder) => {
		const cssFilePaths = path.join(builder.nuxt.options.buildDir, 'extra-file')
		fs.writeFileSync(extraFilePath, 'Something extra')
	}); */

	nuxt.hook('render:route', (url, page, { req, res }) => {
		process(page, url);
	});
	nuxt.hook('generate:page', page => {
		process(page);
	});

    //new StylifyModule(this, moduleOptions);
}

export default Stylify;
