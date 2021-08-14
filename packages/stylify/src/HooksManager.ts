export interface HookReturnDataInterface {
	data: any
}

class HooksManager {

	private hooksRegister: Record<string, CallableFunction[]> = {};

	public addHook(hook: string, callback: CallableFunction): void {
		this.getHookQueue(hook).push(callback);
	}

	public callHook(hook: string, hookArguments: any = null): HookReturnDataInterface
	{
		const hookArgumentsWithReference = {
			data: hookArguments
		} as HookReturnDataInterface;

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
