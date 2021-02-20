/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

class CssRecord {
  constructor(selector = null, properties = {}, pseudoClases = []) {
    this.selectors = [];
    this.properties = {};
    this.pseudoClasses = [];

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
    this.MATCH_VARIABLE_REG_EXP = /\$([\w-_]+)/g;
    this.changed = false;
    this.mangleSelectors = false;
    this.dev = false;
    this.screens = {};
    this.processedSelectors = {};
    this.cssTree = {
      '_': {}
    };
    this.variables = {};
    this.lastBuildInfo = null;

    this.setBuildInfo = (data = null) => {
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
    };

    this.setBuildInfo(null);
    this.configure(config);
  }

  configure(config = {}) {
    this.dev = config.dev || this.dev;
    this.screens = config.screens || this.screens;
    this.mangleSelectors = config.mangleSelectors || this.mangleSelectors;
    this.variables = config.variables;
    Object.keys(this.screens).forEach(screenKey => {
      this.cssTree[screenKey] = this.cssTree[screenKey] || {};
    });
  }

  generateCss() {
    let css = '';

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
  }

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
  }

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

class SelectorProperties {
  constructor() {
    this.properties = {};
  }

  add(property, value) {
    this.properties[property] = value;
    return this;
  }

  addMultiple(properties) {
    let property;

    for (property in properties) {
      this.add(property, properties[property]);
    }

    return this;
  }

}

class MacroMatch {
  constructor(match, screensKeys) {
    this.fullMatch = null;
    this.screenAndPseudoClassesMatch = null;
    this.selector = null;
    this.screen = null;
    this.pseudoClasses = [];
    this.captures = [];
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

class EventsEmitter {
  constructor() {
    this.eventListeners = {};

    this.addListener = (event, callback, id = null) => {
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
    };
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

"function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,0;

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = "@font-face {\n  font-family: 'stylify-profiler';\n  src: url('data:font/woff;base64,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') format('woff');\n  font-weight: normal;\n  font-style: normal;\n  font-display: block;\n}\n\n.sp-icon {\n  /* use !important to prevent issues with browser extensions that change fonts */\n  font-family: 'stylify-profiler' !important;\n  speak: never;\n  font-style: normal;\n  font-weight: normal;\n  font-variant: normal;\n  text-transform: none;\n  line-height: 1;\n\n  /* Better Font Rendering =========== */\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.sp-icon-layers:before {\n  content: \"\\e908\";\n}\n.sp-icon-link:before {\n  content: \"\\e907\";\n}\n.sp-icon-layout:before {\n  content: \"\\e900\";\n}\n.sp-icon-tool:before {\n  content: \"\\e901\";\n}\n.sp-icon-dollar-sign:before {\n  content: \"\\e902\";\n}\n.sp-icon-aperture:before {\n  content: \"\\e903\";\n}\n.sp-icon-clock:before {\n  content: \"\\e904\";\n}\n.sp-icon-archive:before {\n  content: \"\\e905\";\n}\n.sp-icon-refresh-cw:before {\n  content: \"\\e906\";\n}\n";
styleInject(css_248z);

class Compiler {
  constructor(config = {}) {
    this.PREGENERATE_MATCH_REG_EXP = new RegExp('stylify-pregenerate:([\\S ]*\\b)', 'igm');
    this.classMatchRegExp = null;
    this.mangleSelectors = false;
    this.dev = false;
    this.macros = {};
    this.helpers = {};
    this.screens = {};
    this.screensKeys = [];
    this.variables = {};
    this.components = {};
    this.pregenerate = '';
    this.componentsSelectorsMap = {};
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
  }

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

export default Compiler;
