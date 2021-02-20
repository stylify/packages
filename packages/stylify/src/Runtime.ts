import { Compiler } from ".";
import EventsEmitter from "./EventsEmitter";

export default class Runtime {

	private readonly STYLIFY_STYLE_EL_ID: string = 'stylify-css';

	private readonly STYLIFY_CLOAK_ATTR_NAME:string = 's-cloak';

	private Compiler: Compiler = null;

	private CompilerResult = null;

	private initialPaintCompleted: Boolean = false;

	public redrawTimeout: number = 10;

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

	public configure(config) {
		this.Compiler = config.compiler;

		if (this.initialPaintCompleted) {
			this.updateCss(document.documentElement.outerHTML);
		}

		this.redrawTimeout = config.redrawTimeout || this.redrawTimeout;

		EventsEmitter.dispatch('stylify:runtime:configured', this);

		return this;
	}

	private updateCss(content: string): string|null {
		this.CompilerResult = this.Compiler.compile(content, this.CompilerResult);

		if (!this.CompilerResult.changed) {
			return null;
		}

		const css = this.CompilerResult.generateCss();
		this.injectCss(css);
		return css;
	}

	public initMutationObserver() {
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
				if (mutation.target.id === this.STYLIFY_STYLE_EL_ID) {
					return;
				}

				compilerContentQueue += mutation.type === 'attributes' && mutation.attributeName === 'class'
					? 'class="' + mutation.target['className'] + '"'
					: mutation.target['outerHTML']
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

	public injectCss(css: string) {
		let el = document.querySelector('#' + this.STYLIFY_STYLE_EL_ID)

		if (el) {
			el.innerHTML = css;
		} else {
			el = document.createElement('style');
			el.id = this.STYLIFY_STYLE_EL_ID
			el.innerHTML = css;
			document.head.appendChild(el);
		}

		const elements = document.querySelectorAll('[' + this.STYLIFY_CLOAK_ATTR_NAME + ']');
		let element: Element;

		for (element of elements) {
			element.removeAttribute(this.STYLIFY_CLOAK_ATTR_NAME)
			EventsEmitter.dispatch('stylify:runtime:uncloak', {
				id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
				el: element,
			});
		}
	}

}
