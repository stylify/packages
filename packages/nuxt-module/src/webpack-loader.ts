import { PrefixesGenerator } from '@stylify/autoprefixer/esm/prefixes-generator';
import { getOptions } from 'loader-utils';

/**
 *
 * @param {string} source
 * @returns {string}
 */
export default function (source: string): string {
	const {
		compiler,
		getPreflightCompilationResult,
		setPreflightCompilationResult,
		mergePrefixesMap
	} = getOptions(this);

	const compilationResult = compiler.compile(source, getPreflightCompilationResult());

	setPreflightCompilationResult(compilationResult);
	mergePrefixesMap(new PrefixesGenerator().createPrefixesMap(compilationResult));

	return compiler.mangleSelectors
		? compiler.rewriteSelectors(compilationResult, source) as string
		: source;
}
