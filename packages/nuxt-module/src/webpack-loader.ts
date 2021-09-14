import { SelectorsRewriter } from '@stylify/stylify';
import { getOptions } from 'loader-utils';
import PrefixesGenerator from '@stylify/autoprefixer/esm/PrefixesGenerator';

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
		? SelectorsRewriter.rewrite(compilationResult, compiler.selectorAttributes, source)
		: source;
}
