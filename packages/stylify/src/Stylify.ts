import {
	Compiler,
	CompilerConfigInterface,
	hooksManager,
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

	public compiler: Compiler = null;

	public runtime: Runtime = null;

	public hooks = null;

	constructor(config: Partial<StylifyConfigInterface> = {}) {
		this.hooks = hooksManager;

		const { data } = this.hooks.callHook('stylify:beforeInit', config);

		this.configure(data);

		this.hooks.callHook('stylify:init', {
			runtime: this.runtime
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

		if (this.compiler) {
			this.compiler.configure(compilerConfig);
		} else {
			this.compiler = new Compiler(compilerConfig);
		}

		if (!('compiler' in runtimeConfig)) {
			runtimeConfig.compiler = this.compiler;
		}

		if (this.runtime) {
			this.runtime.configure(runtimeConfig);
		} else {
			this.runtime = new Runtime(runtimeConfig);
		}

		return this;
	}
}

export { Stylify };

export default Stylify;
