class HooksManager {

	private hooksRegister = {};

	public addHook(hook: string, callback: CallableFunction): this {
		if (!(hook in this.hooksRegister)) {
			this.hooksRegister[hook] = [];
		}

		this.hooksRegister[hook].push(callback);

		return this;
	}

	public callHook(hook: string, parameters: any|null = []): this
	{
		if (!Array.isArray(parameters)) {
			parameters = [parameters];
		}

		if (!(hook in this.hooksRegister)) {
			return;
		}

		this.hooksRegister[hook].forEach((hookCallback: CallableFunction) => {
			hookCallback(...parameters);
		});

		return this;
	}

}

export default new HooksManager();
