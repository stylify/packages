export interface HookReturnDataInterface {
	data: any
}

class HooksManager {

	private hooksCallsHistory: Record<string, Record<string, any>[]> = {};

	private hooksRegister: Record<string, CallableFunction[]> = {};

	public addHook(hook: string, callback: CallableFunction): void {
		this.getHookQueue(hook).push(callback);

		if (hook in this.hooksCallsHistory) {
			for (const hookArguments of this.hooksCallsHistory[hook]) {
				this.callHook(hook, hookArguments);
			}
		}
	}

	public callHook(hook: string, hookArguments: any = null, keepHistory = false): HookReturnDataInterface
	{
		const hookArgumentsWithReference: HookReturnDataInterface = {
			data: hookArguments
		};

		if (keepHistory) {
			if (!(hook in this.hooksCallsHistory)) {
				this.hooksCallsHistory[hook] = [];
			}

			this.hooksCallsHistory[hook].push(hookArguments);
		}

		this.getHookQueue(hook).forEach((hookCallback: CallableFunction) => {
			hookCallback(...[hookArgumentsWithReference]);
		});

		return hookArgumentsWithReference;
	}

	private getHookQueue(hook: string): CallableFunction[] {
		if (!(hook in this.hooksRegister)) {
			this.hooksRegister[hook] = [];
		}

		return this.hooksRegister[hook];
	}

}

export default new HooksManager();
