import { env } from 'process';

interface ProcessArgumentsInterface {
	selectedPackages: string[]
}

class ArgumentsProcessor {

	public processArguments: ProcessArgumentsInterface = {
		selectedPackages: 'packages' in env ? env.packages.split(',') : []
	}

	public canProcessPackage(packageName: string): boolean {
		if (!this.processArguments.selectedPackages.length) {
			return true;
		}

		return this.processArguments.selectedPackages.includes(packageName);
	}

}

export const argumentsProcessor = new ArgumentsProcessor();
