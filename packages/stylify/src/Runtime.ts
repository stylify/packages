import { CompilationResult, Compiler, CompilerConfigInterface } from './Compiler';

export interface RuntimeConfigInterface {
	dev?: boolean,
	compiler?: CompilerConfigInterface,
	runtime?: {
		repaintTimeout?: number
	}
}

interface UpdateCssCallbackArgumentsInterface {
	css: string|null,
	compilationResult: CompilationResult,
	content: string
}

type UpdateCssCallbackType = (data: UpdateCssCallbackArgumentsInterface) => void;

export class Runtime {

	public static readonly STYLE_EL_ID: string = 'stylify-css';

	public static readonly IGNORE_CLASS = 'stylify-ignore';

	public static readonly CLOAK_CLASS: string = 's-cloak';

	public dev = false;

	public compiler: Compiler = null;

	public compilationResult: CompilationResult = null;

	private initialPaintCompleted = false;

	private mutationObserverInitialized = false;

	public repaintTimeout = 100;

	constructor(config: RuntimeConfigInterface = {}) {
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

	public configure(config: RuntimeConfigInterface): void {
		const runtimeConfig = config.runtime || {};
		const compilerConfig = config.compiler || {};

		if (this.initialPaintCompleted) {
			this.updateCss(document.documentElement.outerHTML);
		}

		this.dev = 'dev' in config ? config.dev : this.dev;
		this.repaintTimeout = runtimeConfig.repaintTimeout || this.repaintTimeout;

		compilerConfig.dev = this.dev;
		compilerConfig.ignoredAreas = [
			...compilerConfig.ignoredAreas || [],
			...[/<stylify-runtime-ignore[\s]*?>([\s\S]*?)<\/stylify-runtime-ignore>/]
		];

		if (!this.compiler) {
			this.compiler = new Compiler();
		}

		this.compiler.configure(compilerConfig);

		this.triggerEvent('stylify:configured', {
			config: config
		});
	}

	private init() {
		if (!this.initialPaintCompleted) {
			const content = document.documentElement.outerHTML;
			this.updateCss(content, () => {
				this.initialPaintCompleted = true;
			});
		}

		if (!this.mutationObserverInitialized) {
			this.initMutationObserver();
		}
	}

	private updateCss(content: string, callback: UpdateCssCallbackType = null): string|null {
		this.compilationResult = this.compiler.compile(content, this.compilationResult);

		if (!this.compilationResult.changed && this.initialPaintCompleted) {
			return null;
		}

		const css: string = this.compilationResult.generateCss();
		this.injectCss(css);

		if (callback) {
			callback({
				css: css,
				compilationResult: this.compilationResult,
				content: content
			});
		}

		this.triggerEvent('stylify:repainted', {
			css: css,
			compilationResult: this.compilationResult,
			content: content
		});

		return css;
	}

	public initMutationObserver(): void {
		this.mutationObserverInitialized = true;
		const targetNode = document.documentElement;
		const config = { attributeFilter: ['class'], childList: true, subtree: true };
		let compilerContentQueue = '';
		let updateTimeout: number;
		const ignoreSelector = `.${Runtime.IGNORE_CLASS}`;

		const observer = new MutationObserver((mutationsList) => {
			mutationsList.forEach((mutation) => {
				let targetElement = mutation.target as Element;

				if (!['attributes', 'childList'].includes(mutation.type)
					|| mutation.type === 'attributes' && mutation.attributeName !== 'class'
					|| targetElement.nodeType !== Node.ELEMENT_NODE
					|| targetElement.id === Runtime.STYLE_EL_ID
					|| targetElement.classList.contains(Runtime.IGNORE_CLASS)
					|| targetElement.closest(ignoreSelector) !== null
				) {
					return;
				}

				targetElement = targetElement.cloneNode(true) as Element;
				targetElement.querySelectorAll(ignoreSelector).forEach((element) => {
					element.remove();
				});

				compilerContentQueue += mutation.type === 'attributes'
					? ` class="${targetElement.className}"`
					: targetElement.outerHTML;
			});

			if (updateTimeout) {
				window.clearTimeout(updateTimeout);
			}

			if (!compilerContentQueue.trim().length) {
				return;
			}

			updateTimeout = window.setTimeout(() => {
				const css = this.updateCss(compilerContentQueue);

				if (css === null) {
					return;
				}

				compilerContentQueue = '';

			}, this.repaintTimeout);
		});

		observer.observe(targetNode, config);
	}

	public injectCss(css: string): void {
		let el = document.querySelector(`#${Runtime.STYLE_EL_ID}`);

		if (el) {
			el.innerHTML = css;
		} else {
			el = document.createElement('style');
			el.id = Runtime.STYLE_EL_ID;
			el.innerHTML = css;
			document.head.appendChild(el);
		}

		const elements = document.querySelectorAll(`.${Runtime.CLOAK_CLASS}`);
		elements.forEach((element) => {
			element.classList.remove(Runtime.CLOAK_CLASS);
			this.triggerEvent('stylify:uncloak', {
				el: element
			});
		});
	}

	private triggerEvent(eventName: string, eventData: any): void {
		const event = new window.CustomEvent(eventName, eventData ? {detail: eventData} : null);
		document.dispatchEvent(event);
	}

}
