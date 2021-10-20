import { env } from 'process';

interface ProcessArgumentsInterface {
	selectedPackages: string[],
	isWatchMode: boolean,
	isDevMode: boolean
}

class ArgumentsProcessor {

	public processArguments: ProcessArgumentsInterface = {
		selectedPackages: 'packages' in env ? env.packages.split(',') : [],
		isWatchMode: !!process.env.ROLLUP_WATCH,
		isDevMode: !!(process.env.ROLLUP_WATCH || process.env.JEST_WORKER_ID !== undefined)
	}

	public canProcessPackage(packageName: string): boolean {
		if (!this.processArguments.selectedPackages.length) {
			return true;
		}

		return this.processArguments.selectedPackages.includes(packageName);
	}

}

export const argumentsProcessor = new ArgumentsProcessor();
