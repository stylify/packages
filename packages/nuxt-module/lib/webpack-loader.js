const { getOptions } = require('loader-utils');
const { SelectorsRewriter } = require('@stylify/stylify');

module.exports = function (source) {
	const { Compiler, loadCompilationResultCache, saveCompilationResultCache } = getOptions(this);

	let compilationResult = Compiler.createResultFromSerializedData(loadCompilationResultCache());

	compilationResult = Compiler.compile(source, compilationResult);
	saveCompilationResultCache(compilationResult.serialize());

	return Compiler.mangleSelectors
		? SelectorsRewriter.rewrite(compilationResult, Compiler.classMatchRegExp, source)
		: source
}
