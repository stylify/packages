import {
	CompilationResultHooksListInterface,
	CompilerHooksListInterface,
	CssRecordHooksListInterface
} from './Compiler';

type HookCallbackType<HookDataType = any> = (data: HookDataType) => void|Promise<HookDataType>;

export interface DefaultHooksListInterface extends
	CompilationResultHooksListInterface,
	CompilerHooksListInterface,
	CssRecordHooksListInterface {
}

export type DefaultHooksNamesListType = keyof DefaultHooksListInterface;

const hookListeners: Record<string, HookCallbackType[]> = {};

export class Hooks<HooksList> {

	public addListener<HookName extends keyof HooksList, HookData = HooksList[HookName]>(
		hookName: HookName, callback: HookCallbackType<HookData>
	) {
		if (!(hookName in hookListeners)) {
			hookListeners[hookName as string] = [];
		}

		hookListeners[hookName as string].push(callback);
	}

	public callHook<HookName extends keyof HooksList, HookData = HooksList[HookName]>(
		hookName: HookName, data: HookData
	): HookData {
		const hookData = this.createHookData<HookData>(data);

		for (const hookCallback of hookListeners[hookName as string] ?? []) {
			hookCallback(hookData) as void;
		}

		return hookData;
	}

	public async callAsyncHook<HookName extends keyof HooksList, HookData = HooksList[HookName]>(
		hookName: HookName, data: HookData
	): Promise<HookData> {
		const hookData = this.createHookData(data);

		const callHook = async (id = 0): Promise<HookData> => {
			const hook = (hookListeners[hookName as string] ?? [])[id] ?? null;

			if (!hook) {
				return;
			}

			const hookResult = hook(hookData);

			if (hookResult instanceof Promise) {
				await hookResult;
			}

			return callHook(id + 1);
		};

		await callHook();

		return hookData;
	}

	private createHookData<HookDataType>(data: HookDataType): HookDataType {
		return { ...data };
	}
}

export const hooks = new Hooks<DefaultHooksListInterface>();
