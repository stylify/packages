import type { CompilationResult } from '@stylify/stylify';
import { getOptions } from 'loader-utils';

export default function (source: string): string {
	if (source.includes('<style id="stylify-css">')) {
		return source;
	}

	const {
		compiler,
		getCompilationResult,
		setCompilationResult
	} = getOptions(this);

	const compilationResult: CompilationResult = compiler.compile(source, getCompilationResult());
	setCompilationResult(compilationResult);
	const css = compilationResult.generateCss();

	if (compiler.mangleSelectors) {
		source = compiler.rewriteSelectors(source, compilationResult) as string;
	}

	if (css) {
		source += `<style id="stylify-css">${css}</style>`;
	}

	return source;
}
