import { createVueApp } from '.';

export class Toolbar extends HTMLElement {

	public static toolbarId = 'stylify-profiler';

	private shadow: ShadowRoot = null;

	constructor() {
		super();

		const styleElement = document.createElement('style');
		styleElement.textContent = '* {color:red}';

		const rootElement = document.createElement('div');

		this.shadow = this.attachShadow({mode: 'open'});
		this.shadow.appendChild(rootElement);
		this.shadow.appendChild(styleElement);

		createVueApp({
			data: () => ({
				count: 0
			}),
			template: `
				<button @click="count++">
					You clicked me {{ count }} times.
				</button>
			`
		}).mount(rootElement);
	}

}
