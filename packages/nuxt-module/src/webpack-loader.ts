import { SelectorsRewriter } from '@stylify/stylify';
import { getOptions } from 'loader-utils';

/**
 *
 * @param {string} source
 * @returns {string}
 */
export default function (source: string): string {
	const { Compiler, loadCompilationResultCache, saveCompilationResultCache } = getOptions(this);

	let compilationResult = Compiler.createResultFromSerializedData(loadCompilationResultCache());

	compilationResult = Compiler.compile(source, compilationResult);
	saveCompilationResultCache(compilationResult.serialize());

	return Compiler.mangleSelectors
		? SelectorsRewriter.rewrite(compilationResult, Compiler.classMatchRegExp, source) as string
		: source;
}
