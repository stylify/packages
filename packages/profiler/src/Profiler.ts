import { Toolbar, runtimeExtension } from '.';

export class Profiler {

	private extensions = {

	};

	constructor() {
		this.addExtension('Runtime', runtimeExtension);
		this.init();
	}

	public addExtension(name: string, install: CallableFunction): void {
		this.extensions[name] = install;
	}

	private init() {
		customElements.define('stylify-profiler', Toolbar);

		const toolbarElement = document.createElement('stylify-profiler');
		document.querySelector('body').appendChild(toolbarElement);
	}

}
