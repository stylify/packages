// @ts-nocheck

import { Compiler, EventsEmitter } from '.';

export default class Runtime {

	private readonly STYLIFY_STYLE_EL_ID: string = 'stylify-css';

	private readonly STYLIFY_CLOAK_ATTR_NAME:string = 's-cloak';

	private Compiler: Compiler = null;

	private CompilerResult = null;

	private initialPaintCompleted = false;

	public redrawTimeout = 10;

	constructor(config: Record<string, any> = {}) {
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

	public configure(config): Runtime {
		this.Compiler = config.compiler;

		// What if cache
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

	private hydrate(data: string|Record<string, any> = null): void {
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

		if (this.CompilerResult = this.Compiler.createResultFromSerializedData(parsedData)) {
			this.CompilerResult;
		} else {
			this.CompilerResult.hydrate(parsedData);
		}

		EventsEmitter.dispatch('stylify:runtime:hydrated', {
			cache: parsedData
		});
	}

	private updateCss(content: string): string|null {
		this.hydrate();
		this.CompilerResult = this.Compiler.compile(content, this.CompilerResult);

		if (!this.CompilerResult.changed && this.initialPaintCompleted) {
			return null;
		}

		const css = this.CompilerResult.generateCss();
		this.injectCss(css);
		return css;
	}

	public initMutationObserver(): void {
		const targetNode = document.documentElement;
		const config = { attributeFilter: ['class'], childList: true, subtree: true };
		let compilerContentQueue = '';
		let updateTimeout = null;
		let repaintStartTime = null;

		const observer = new MutationObserver((mutationsList) => {
			if (repaintStartTime === null) {
				repaintStartTime = performance.now();
			}

			mutationsList.forEach(mutation => {
				if (mutation.target.nodeType !== Node.ELEMENT_NODE || mutation.target.id === this.STYLIFY_STYLE_EL_ID) {
					return;
				}

				compilerContentQueue += mutation.type === 'attributes' && mutation.attributeName === 'class'
					? 'class="' + mutation.target['className'] + '"'
					: mutation.target['outerHTML'];
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

	public injectCss(css: string): void {
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
		let element: Element;

		for (element of elements) {
			element.removeAttribute(this.STYLIFY_CLOAK_ATTR_NAME);
			EventsEmitter.dispatch('stylify:runtime:uncloak', {
				id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
				el: element
			});
		}
	}

}
