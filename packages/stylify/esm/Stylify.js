/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

import { EventsEmitter, Compiler } from '.';

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

      EventsEmitter.dispatch('stylify:runtime:repainted', {
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
    EventsEmitter.dispatch('stylify:runtime:configured', {
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

    EventsEmitter.dispatch('stylify:runtime:hydrated', {
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

        EventsEmitter.dispatch('stylify:runtime:repainted', {
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
      EventsEmitter.dispatch('stylify:runtime:uncloak', {
        id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
        el: element
      });
    }
  }

}

class Stylify {
  constructor(config = {}) {
    this.Compiler = null;
    this.Runtime = null;
    this.EventsEmitter = null;
    this.EventsEmitter = EventsEmitter;
    EventsEmitter.dispatch('stylify:beforeInit', {
      config: config
    });
    this.configure(config);
    EventsEmitter.dispatch('stylify:init', {
      runtime: this.Runtime
    });
  }

  configure(config) {
    const compilerConfig = config.compiler || {};
    const runtimeConfig = config.runtime || {};

    if (!this.Compiler) {
      this.Compiler = new Compiler(compilerConfig);
    } else {
      this.Compiler.configure(compilerConfig || {});
    }

    if (!('compiler' in runtimeConfig)) {
      runtimeConfig.compiler = this.Compiler;
    }

    if (!this.Runtime) {
      this.Runtime = new Runtime(runtimeConfig);
    } else {
      this.Runtime.configure(runtimeConfig);
    }

    return this;
  }

}

export default Stylify;
