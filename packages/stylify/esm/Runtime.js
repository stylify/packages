/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

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

class Runtime {
  constructor(config = {}) {
    this.STYLIFY_STYLE_EL_ID = 'stylify-css';
    this.STYLIFY_CLOAK_ATTR_NAME = 's-cloak';
    this.Compiler = null;
    this.CompilerResult = null;
    this.initialPaintCompleted = false;
    this.redrawTimeout = 10;

    if (typeof document === 'undefined') {
      return;
    }

    const repaintStartTime = performance.now();
    this.configure(config);
    this.initialPaintCompleted = false;
    const content = document.documentElement.outerHTML;
    document.addEventListener('DOMContentLoaded', () => {
      const css = this.updateCss(content);
      this.initialPaintCompleted = true;
      this.initMutationObserver();

      if (css === null) {
        return;
      }

      EventsEmitter$1.dispatch('stylify:runtime:repainted', {
        css: css,
        repaintTime: performance.now() - repaintStartTime,
        compilerResult: this.CompilerResult,
        content: content
      });
    });
  }

  configure(config) {
    this.Compiler = config.compiler;

    if (typeof config.cache !== 'undefined' && !this.initialPaintCompleted) {
      this.hydrate(config.cache);
    }

    if (this.initialPaintCompleted) {
      this.updateCss(document.documentElement.outerHTML);
    }

    this.redrawTimeout = config.redrawTimeout || this.redrawTimeout;
    EventsEmitter$1.dispatch('stylify:runtime:configured', {
      config: config
    });
    return this;
  }

  hydrate(data = null) {
    if (!data) {
      const cacheElements = document.querySelectorAll('.stylify-runtime-cache');
      let cacheElement;

      if (cacheElements.length) {
        for (cacheElement of cacheElements) {
          cacheElement.classList.add('processed');

          if (cacheElement.innerHTML.trim().length > 0) {
            this.hydrate(cacheElement.innerHTML);
          }

          cacheElement.parentElement.removeChild(cacheElement);
        }

        return;
      }
    }

    if (!data) {
      return;
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    this.Compiler.hydrate(parsedData);

    if (!this.CompilerResult) {
      this.CompilerResult = this.Compiler.createResultFromSerializedData(parsedData);
    } else {
      this.CompilerResult.hydrate(parsedData);
    }

    EventsEmitter$1.dispatch('stylify:runtime:hydrated', {
      cache: parsedData
    });
  }

  updateCss(content) {
    this.hydrate();
    this.CompilerResult = this.Compiler.compile(content, this.CompilerResult);

    if (!this.CompilerResult.changed && this.initialPaintCompleted) {
      return null;
    }

    const css = this.CompilerResult.generateCss();
    this.injectCss(css);
    return css;
  }

  initMutationObserver() {
    const targetNode = document.documentElement;
    const config = {
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    };
    let compilerContentQueue = '';
    let updateTimeout = null;
    let repaintStartTime = null;
    const observer = new MutationObserver(mutationsList => {
      if (repaintStartTime === null) {
        repaintStartTime = performance.now();
      }

      mutationsList.forEach(mutation => {
        if (mutation.target.nodeType !== Node.ELEMENT_NODE || mutation.target.id === this.STYLIFY_STYLE_EL_ID) {
          return;
        }

        compilerContentQueue += mutation.type === 'attributes' && mutation.attributeName === 'class' ? 'class="' + mutation.target['className'] + '"' : mutation.target['outerHTML'];
      });

      if (!compilerContentQueue.trim().length) {
        return;
      }

      if (updateTimeout) {
        window.clearTimeout(updateTimeout);
      }

      updateTimeout = window.setTimeout(() => {
        const css = this.updateCss(compilerContentQueue);
        const repaintTime = performance.now() - repaintStartTime;
        repaintStartTime = null;

        if (css === null) {
          return;
        }

        EventsEmitter$1.dispatch('stylify:runtime:repainted', {
          css: css,
          repaintTime: repaintTime,
          compilerResult: this.CompilerResult,
          content: compilerContentQueue
        });
        repaintStartTime = null;
        compilerContentQueue = '';
      }, this.redrawTimeout);
    });
    observer.observe(targetNode, config);
  }

  injectCss(css) {
    let el = document.querySelector('#' + this.STYLIFY_STYLE_EL_ID);

    if (el) {
      el.innerHTML = css;
    } else {
      el = document.createElement('style');
      el.id = this.STYLIFY_STYLE_EL_ID;
      el.innerHTML = css;
      document.head.appendChild(el);
    }

    const elements = document.querySelectorAll('[' + this.STYLIFY_CLOAK_ATTR_NAME + ']');
    let element;

    for (element of elements) {
      element.removeAttribute(this.STYLIFY_CLOAK_ATTR_NAME);
      EventsEmitter$1.dispatch('stylify:runtime:uncloak', {
        id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
        el: element
      });
    }
  }

}

export default Runtime;
