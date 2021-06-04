// @ts-nocheck

import { Compiler, EventsEmitter } from '.';
import Runtime from './Runtime';

export default class Stylify {

	public Compiler: Compiler = null;

	public Runtime: Runtime = null;

	public EventsEmitter = null;

	constructor(config: Record<string, any> = {}) {
		this.EventsEmitter = EventsEmitter;

		EventsEmitter.dispatch('stylify:beforeInit', {
			config: config
		});

		this.configure(config);

		EventsEmitter.dispatch('stylify:init', {
			runtime: this.Runtime
		});
	}

	public configure(config: Record<string, any>): Stylify {
		const compilerConfig: Record<string, any> = config.compiler || {};
		const runtimeConfig: Record<string, any> = config.runtime || {};

		if (this.Compiler) {
			this.Compiler.configure(compilerConfig || {});
		} else {
			this.Compiler = new Compiler(compilerConfig);
		}

		if (!('compiler' in runtimeConfig)) {
			runtimeConfig.compiler = this.Compiler;
		}

		if (this.Runtime) {
			this.Runtime.configure(runtimeConfig);
		} else {
			this.Runtime = new Runtime(runtimeConfig);
		}

		return this;
	}
}
