import { Compiler } from ".";
import EventsEmitter from "./EventsEmitter";

export default class Runtime {

	private readonly STYLIFY_STYLE_EL_ID: string = 'stylify-css';

	private readonly STYLIFY_CLOAK_ATTR_NAME:string = 's-cloak';

	private Compiler: Compiler = null;

	private initialPaintCompleted: Boolean = false;

	public initialCss = '';

	constructor(config: Record<string, any> = {}) {
		if (typeof document === 'undefined') {
			return;
		}

		const repaintStartTime = performance.now();
		EventsEmitter.dispatch('stylify:repaint:start');
		this.configure(config);
		this.initialPaintCompleted = false;

		document.addEventListener('DOMContentLoaded', () => {
			this.injectCss(this.Compiler.compile(document.documentElement.outerHTML).css);
			this.initialPaintCompleted = true;
			this.initMutationObserver();
		});

		EventsEmitter.dispatch('stylify:repaint:end', {
			repaintTime: performance.now() - repaintStartTime
		});
	}

	public configure(config) {
		if (!('initialCss' in config.compiler)) {
			config.compiler.initialCss = '';
		};

		this.Compiler = config.compiler;

		if (this.initialPaintCompleted) {
			this.injectCss(this.Compiler.compile(document.documentElement.outerHTML).css);
		}

		EventsEmitter.dispatch('stylify:runtime:configured', this);

		return this;
	}

	public initMutationObserver() {
		const targetNode = document.documentElement;
		const config = { attributeFilter: ['class'], childList: true, subtree: true };
		const observer = new MutationObserver((mutationsList) => {

			const repaintStartTime = performance.now();
			EventsEmitter.dispatch('stylify:repaint:start');
			console.log(mutationsList);
			let compilerContent = mutationsList
				.map(mutation => {
					return mutation.target.id === this.STYLIFY_STYLE_EL_ID
						? ''
						: mutation.target[
							mutation.type === 'attributes' && mutation.attributeName === 'class'
								? 'className'
								: 'outerHTML'
						]
				})
				.join('');

			if (!compilerContent.trim().length) {
				return;
			}

			const compilerResult = this.Compiler.compile(compilerContent);

			if (!compilerResult.wasAnyCssGenerated) {
				return;
			}

			this.injectCss(compilerResult.css);

			EventsEmitter.dispatch('stylify:repaint:end', {
				repaintTime: performance.now() - repaintStartTime
			});
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

		const elements = document.querySelectorAll('[' + this.STYLIFY_CLOAK_ATTR_NAME + ']');
		let element: Element;

		EventsEmitter.dispatch('stylify:css:injected', {
			css: css
		});

		for (element of elements) {
			EventsEmitter.dispatch('stylify:uncloak', {
				id: element.getAttribute(this.STYLIFY_CLOAK_ATTR_NAME) || null,
				el: element,
			})
			element.removeAttribute(this.STYLIFY_CLOAK_ATTR_NAME)
		}
	}

}
