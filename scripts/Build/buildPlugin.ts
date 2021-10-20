export interface RollupHooksListInterface {
	options?: CallableFunction,
	buildStart?: CallableFunction,
	resolvedId?: CallableFunction,
	load?: CallableFunction,
	transform?: CallableFunction,
	moduleParsed?: CallableFunction,
	resolveDynamicImport?: CallableFunction,
	buildEnd?: CallableFunction,
	watchChange?: CallableFunction,
	closeWatcher?: CallableFunction
}

export interface BuildPluginOptionsInterface {
	hooks?: RollupHooksListInterface
}

export const buildPlugin = (options: BuildPluginOptionsInterface): Record<string, any> => {
	let pluginInfo = {
		name: 'stylifyBuildPlugin'
	};

	pluginInfo = {...pluginInfo, ...options.hooks || {}};

	return pluginInfo;
};

