import { getOptions } from 'loader-utils';

const queryIsTemplateType = (resourceQuery: string): boolean => {
	return resourceQuery.includes('type=template');
};

const queryIsEmpty = (resourceQuery: string): boolean => {
	return resourceQuery.length === 0;
};

export default function (source: string): string {
	const { resourceQuery }:{ resourceQuery: string} = this;

	if (!queryIsEmpty(resourceQuery) && ! queryIsTemplateType(resourceQuery)) {
		return source;
	}

	const { getCompiler } = getOptions(this);

	const compiler = getCompiler();

	if (compiler.mangleSelectors && queryIsTemplateType(resourceQuery)) {
		source = compiler.rewriteSelectors(source) as string;
	}

	return source;
}
