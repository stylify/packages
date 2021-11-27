import { argumentsProcessor } from '../ArgumentsProcessor';
import { TypesGenerator } from '../TypesGenerator';

export const typesPlugin = (packageName: string): Record<string, any> => {
	const generateTypes = () => {
		new TypesGenerator(packageName);
	};

	return {
		name: 'stylifyTypesPlugin',
		[argumentsProcessor.processArguments.isWatchMode ? 'watchChange' : 'buildEnd']: generateTypes
	};
};
