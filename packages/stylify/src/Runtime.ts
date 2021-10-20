import { CompilationResult, Compiler, CompilerConfigInterface, SerializedCompilationResultInterface } from '.';

export interface RuntimeConfigInterface {
	dev?: boolean,
	compiler?: CompilerConfigInterface,
	runtime?: {
		cache?: string | SerializedCompilationResultInterface,
		repaintTimeout?: number
	}
}

class Runtime {

	private readonly STYLIFY_STYLE_EL_ID: string = 'stylify-css';

	private readonly STYLIFY_CLOAK_ATTR_NAME:string = 's-cloak';

	public dev = false;

	public compiler: Compiler = null;

	public compilationResult: CompilationResult = null;

	private initialPaintCompleted = false;

	private mutationObserverInitialized = false;

	public repaintTimeout = 5;

	constructor(config: Partial<RuntimeConfigInterface> = {}) {
		if (typeof document === 'undefined') {
			return;
		}

		this.configure(config);
		this.initialPaintCompleted = false;

		this.triggerEvent('stylify:ready', this);

		if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
			this.init();
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				this.init();
			});
		}
	}

	public configure(config: Partial<RuntimeConfigInterface>): Record<string, any> {
		const runtimeConfig = config.runtime || {};
		const compilerConfig = config.compiler || {};

		if (typeof runtimeConfig.cache !== 'undefined' && !this.initialPaintCompleted) {
			this.hydrate(runtimeConfig.cache);
		}

		if (this.initialPaintCompleted) {
			this.updateCss(document.documentElement.outerHTML);
		}

		this.dev = 'dev' in config ? config.dev : this.dev;
		this.repaintTimeout = runtimeConfig.repaintTimeout || this.repaintTimeout;

		this.triggerEvent('stylify:runtime:configured', {
			config: config
		});

		compilerConfig.dev = this.dev;

		if (!this.compiler) {
			this.compiler = new Compiler();
		}

		compilerConfig.ignoredElements = [...compilerConfig.ignoredElements || [], ...['stylify-runtime-ignore']];

		this.compiler.configure(compilerConfig);

		this.triggerEvent('stylify:compiler:configured', {
			compiler: this
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
				this.triggerEvent('stylify:runtime:repainted', {
					css: css,
					repaintTime: performance.now() - repaintStartTime,
					compilationResult: this.compilationResult,
					content: content
				});
			}
		}

		if (!this.mutationObserverInitialized) {
			this.initMutationObserver();
		}
	}

	public hydrate(data: string|SerializedCompilationResultInterface = null): void {
		if (!data) {
			const cacheElements = document.querySelectorAll('.stylify-runtime-cache') || [];
			cacheElements.forEach((cacheElement: Element) => {
				cacheElement.classList.add('processed');
				if (cacheElement.innerHTML.trim().length > 0) {
					this.hydrate(cacheElement.innerHTML);
				}
				cacheElement.parentElement.removeChild(cacheElement);
			});
			return;
		}

		const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
		this.compiler.hydrate(parsedData);

		if (this.compilationResult) {
			this.compilationResult.hydrate(parsedData);
		} else {
			this.compilationResult = this.compiler.createCompilationResultFromSerializedData(parsedData);
		}

		this.triggerEvent('stylify:runtime:hydrated', {
			cache: parsedData
		});
	}

	private updateCss(content: string): string|null {
		this.hydrate();
		this.compilationResult = this.compiler.compile(content, this.compilationResult);

		if (!this.compilationResult.changed && this.initialPaintCompleted) {
			return null;
		}

		const css: string = this.compilationResult.generateCss();
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
				const targetElement = mutation.target as Element;

				if (!(mutation.type === 'attributes' && mutation.attributeName === 'class')
					|| targetElement.nodeType !== Node.ELEMENT_NODE
					|| targetElement.id === this.STYLIFY_STYLE_EL_ID
					|| targetElement.classList.contains('stylify-ignore')
					|| targetElement.closest('.stylify-ignore') !== null
				) {
					return;
				}

				compilerContentQueue += mutation.type === 'attributes' && mutation.attributeName === 'class'
					? targetElement.className
					: targetElement.outerHTML;
			});

			if (!compilerContentQueue.trim().length) {
				repaintStartTime = null;
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

				this.triggerEvent('stylify:runtime:repainted', {
					css: css,
					repaintTime: repaintTime,
					compilationResult: this.compilationResult,
					content: compilerContentQueue
				});

				repaintStartTime = null;
				compilerContentQueue = '';

			}, this.repaintTimeout);
		});

		observer.observe(targetNode, config);
	}

	public injectCss(css: string): void {
		let el = document.querySelector(`#${this.STYLIFY_STYLE_EL_ID}`);

		if (el) {
			el.innerHTML = css;
		} else {
			el = document.createElement('style');
			el.id = this.STYLIFY_STYLE_EL_ID;
			el.innerHTML = css;
			document.head.appendChild(el);
		}

		const elements = document.querySelectorAll(`[${this.STYLIFY_CLOAK_ATTR_NAME}]`);
		elements.forEach((element) => {
			element.removeAttribute(this.STYLIFY_CLOAK_ATTR_NAME);
			this.triggerEvent('stylify:runtime:uncloak', {
				id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
				el: element
			});
		});
	}

	private triggerEvent(eventName: string, eventData: any): void {
		const event = new window.CustomEvent(eventName, eventData ? {detail: eventData} : null);
		document.dispatchEvent(event);
	}

}

export { Runtime };

export default Runtime;
