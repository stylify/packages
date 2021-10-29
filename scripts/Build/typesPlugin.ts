import { TypesGenerator } from '../TypesGenerator';

export const typesPlugin = (packageName: string): Record<string, any> => {
	const generateTypes = () => {
		new TypesGenerator(packageName);
	};

	return {
		name: 'stylifyTypesPlugin',
		watchChange: generateTypes
	};
};
