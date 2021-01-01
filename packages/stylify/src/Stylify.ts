import { Compiler, Runtime } from ".";
import MacroMatch from "./Compiler/MacroMatch";
import SelectorProperties from "./Compiler/SelectorProperties";
import nativeConfig from './configurations/native';

export default class Stylify {

	private Compiler: Compiler = null;

	private Runtime: Runtime = null;

	constructor(config: Record<string, any> = {}) {
		new CustomEvent('stylify:beforeInit', {
			config: config
		});

		this.configure(config);

		new CustomEvent('stylify:init', {
			runtime: this.Runtime,
		});
	}

	public configure(config: Record<string, any>) {
		const compilerConfig = config.compiler || {};
		const runtimeConfig = config.runtime || {};

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

		new CustomEvent('stylify:configure', {
			Compiler: this.Compiler.getConfig(),
			Runtime: this.Runtime.getConfig()
		});
	}
}

if (typeof window !== 'undefined') {
	(<any>window).Stylify = new Stylify();
}

;(<any>window).Stylify.configure(nativeConfig);
