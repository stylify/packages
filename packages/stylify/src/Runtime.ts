import { Compiler } from ".";

export default class Runtime {

	private readonly STYLIFY_STYLE_EL_ID: string = 'stylify-css';

	private readonly STYLIFY_CLOAK_ATTR_NAME:string = 's-cloak';

	private Compiler: Compiler = null;

	private config: Record<string, any> = {};

	private initialPaintCompleted: Boolean = false;

	constructor(config: Record<string, any> = {}) {
		this.configure(config);
		this.initialPaintCompleted = false;

		if (typeof document !== 'undefined') {
			document.addEventListener('DOMContentLoaded', () => {
				this.injectCss(this.Compiler.compile(document.documentElement.outerHTML).css);
				this.initialPaintCompleted = true;
				this.initMutationObserver();
			});
		}
	}

	public configure(config) {
		if (!('initialCss' in config.compiler)) {
			config.compiler.initialCss = '';
		};

		this.Compiler = config.compiler;

		if (this.initialPaintCompleted) {
			this.injectCss(this.Compiler.compile(document.documentElement.outerHTML).css);
		}

		return this;
	}

	public getConfig(): Record<string, any> {
		return this.config;
	}

	public initMutationObserver() {
		const targetNode = document.documentElement;
		const config = { attributeFilter: ['class'], childList: true, subtree: true };
		const observer = new MutationObserver((mutationsList) => {
			let mutation;
			let cssCompiled = false;

			for (mutation of mutationsList) {
				if (mutation.target.id === this.STYLIFY_STYLE_EL_ID) {
					continue
				}

				if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
					this.Compiler.compile(mutation.target.className, false)
				} else {
					this.Compiler.compile(mutation.target.outerHTML, false)
				}

				cssCompiled = true;
			}

			if (!cssCompiled) {
				return;
			}

			this.injectCss(this.Compiler.generateCss());
		});

		observer.observe(targetNode, config);
	}

	public injectCss(css) {
		let el = document.querySelector('#' + this.STYLIFY_STYLE_EL_ID)

		if (el) {
			el.innerHTML = css;
		} else {
			el = document.createElement('style');
			el.id = this.STYLIFY_STYLE_EL_ID
			el.innerHTML = css;
			document.head.appendChild(el);
		}

		const elements: NodeListOf<Element> = document.querySelectorAll('[' + this.STYLIFY_CLOAK_ATTR_NAME + ']');
		let element: Element;

		for (element of elements) {
			new CustomEvent('stylify:uncloak', {
				id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
				el: element,
			})
			element.removeAttribute(this.STYLIFY_CLOAK_ATTR_NAME)
		}
	}

}
