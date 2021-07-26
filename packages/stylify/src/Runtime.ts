import { Compiler, SerializedCompilerInterface } from './Compiler';
import { CompilationResult } from './Compiler/CompilationResult';
import HooksManager from './HooksManager';

export interface RuntimeConfigInterface {
	compiler: Compiler,
	cache: string | SerializedCompilerInterface,
	redrawTimeout: number
}

class Runtime {

	private readonly STYLIFY_STYLE_EL_ID: string = 'stylify-css';

	private readonly STYLIFY_CLOAK_ATTR_NAME:string = 's-cloak';

	private Compiler: Compiler = null;

	private CompilationResult: CompilationResult = null;

	private initialPaintCompleted = false;

	private mutationObserverInitialized = false;

	public redrawTimeout = 5;

	constructor(config: Partial<RuntimeConfigInterface> = {}) {
		if (typeof document === 'undefined') {
			return;
		}

		this.configure(config);
		this.initialPaintCompleted = false;

		if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
			this.init();
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				this.init();
			});
		}
	}

	public configure(config: Partial<RuntimeConfigInterface>): Record<string, any> {
		this.Compiler = config.compiler;

		if (typeof config.cache !== 'undefined' && !this.initialPaintCompleted) {
			this.hydrate(config.cache);
		}

		if (this.initialPaintCompleted) {
			this.updateCss(document.documentElement.outerHTML);
		}

		this.redrawTimeout = config.redrawTimeout || this.redrawTimeout;

		HooksManager.callHook('stylify:runtime:configured', {
			config: config
		});

		return this;
	}

	private init() {
		if (!this.initialPaintCompleted) {
			const repaintStartTime = performance.now();
			const content = document.documentElement.outerHTML;
			const css = this.updateCss(content);
			this.initialPaintCompleted = true;

			if (css !== null) {
				HooksManager.callHook('stylify:runtime:repainted', {
					css: css,
					repaintTime: performance.now() - repaintStartTime,
					compilerResult: this.CompilationResult,
					content: content
				});
			}
		}

		if (!this.mutationObserverInitialized) {
			this.initMutationObserver();
		}
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

			return;
		}

		const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
		this.Compiler.hydrate(parsedData);

		if (this.CompilationResult) {
			this.CompilationResult.hydrate(parsedData);
		} else {
			this.CompilationResult = this.Compiler.createResultFromSerializedData(parsedData);
		}

		HooksManager.callHook('stylify:runtime:hydrated', {
			cache: parsedData
		});
	}

	private updateCss(content: string): string|null {
		this.hydrate();
		this.CompilationResult = this.Compiler.compile(content, this.CompilationResult);

		if (!this.CompilationResult.changed && this.initialPaintCompleted) {
			return null;
		}

		const css: string = this.CompilationResult.generateCss();
		this.injectCss(css);
		return css;
	}

	public initMutationObserver(): void {
		this.mutationObserverInitialized = true;
		const targetNode = document.documentElement;
		const config = { attributeFilter: ['class'], childList: true, subtree: true };
		let compilerContentQueue = '';
		let updateTimeout = null;
		let repaintStartTime = null;

		const observer = new MutationObserver((mutationsList) => {
			if (repaintStartTime === null) {
				repaintStartTime = performance.now();
			}

			mutationsList.forEach((mutation) => {
				if (mutation.target.nodeType !== Node.ELEMENT_NODE
					|| mutation.target['id'] === this.STYLIFY_STYLE_EL_ID
				) {
					return;
				}

				compilerContentQueue += mutation.type === 'attributes' && mutation.attributeName === 'class'
					? `class="${mutation.target['className'] as string}"`
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

				HooksManager.callHook('stylify:runtime:repainted', {
					css: css,
					repaintTime: repaintTime,
					compilerResult: this.CompilationResult,
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
			HooksManager.callHook('stylify:runtime:uncloak', {
				id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
				el: element
			});
		}
	}

}

export { Runtime };

export default Runtime;
