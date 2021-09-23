import { Bundler, BundlerConfigInterface } from './Bundler';

export default class StylifyCommands {

	private commands: Record<string, CallableFunction> = {};

	constructor() {
		this.registerCommand('bundle', this.bundleCommand);
	};

	public registerCommand(task: string, callback: CallableFunction): void {
		this.commands[task] = callback;
	}

	public callCommand(name: string, options: Record<string, any>): void {
		this.commands[name](options);
	}

	private bundleCommand(options: Record<string, any>): void {
		const bundlerConfig: BundlerConfigInterface  = options.bundler;
		const bundler = new Bundler(bundlerConfig);
		bundler.bundle(options.bundleName, options.bundleFiles);
	}

}
