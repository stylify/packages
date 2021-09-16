import {
	Compiler,
	CompilerConfigInterface,
	HooksManager,
	Runtime,
	RuntimeConfigInterface
} from '.';

export interface StylifyConfigInterface {
	dev: boolean,
	compiler: Partial<CompilerConfigInterface>,
	runtime: Partial<RuntimeConfigInterface>
}

class Stylify {

	private dev = false;

	public Compiler: Compiler = null;

	public Runtime: Runtime = null;

	public hooks = null;

	constructor(config: Partial<StylifyConfigInterface> = {}) {
		this.hooks = HooksManager;

		const { data } = this.hooks.callHook('stylify:beforeInit', config);

		this.configure(data);

		this.hooks.callHook('stylify:init', {
			runtime: this.Runtime
		});
	}

	public configure(config: Partial<StylifyConfigInterface>): Stylify {
		const compilerConfig: Record<string, any> = config.compiler || {};
		const runtimeConfig: Record<string, any> = config.runtime || {};

		if ('dev' in config) {
			compilerConfig.dev = config.dev;
			runtimeConfig.dev = config.dev;
			this.dev = config.dev;
		}

		if (this.Compiler) {
			this.Compiler.configure(compilerConfig);
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

export { Stylify };

export default Stylify;
