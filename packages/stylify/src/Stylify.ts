import { Compiler, Runtime } from ".";
import MacroMatch from "./Compiler/MacroMatch";
import SelectorProperties from "./Compiler/SelectorProperties";
import EventsEmitter from "./EventsEmitter";

export default class Stylify {

	public Compiler: Compiler = null;

	public Runtime: Runtime = null;

	constructor(config: Record<string, any> = {}) {
		EventsEmitter.dispatch('stylify:beforeInit', {
			config: config
		});

		this.configure(config);

		EventsEmitter.dispatch('stylify:init', {
			runtime: this.Runtime,
		});
	}

	public configure(config: Record<string, any>): Stylify {
		const compilerConfig: Record<string, any> = config.compiler || {};
		const runtimeConfig: Record<string, any> = config.runtime || {};

		if (!this.Compiler) {
			this.Compiler = new Compiler(compilerConfig);
		} else {
			this.Compiler.configure(compilerConfig || {});
		}

		if (!('compiler' in runtimeConfig)) {
			runtimeConfig.compiler = this.Compiler;
		}

		if (!this.Runtime) {
			this.Runtime = new Runtime(runtimeConfig);
		} else {
			this.Runtime.configure(runtimeConfig);
		}

		return this;
	}
}
