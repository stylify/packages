import type { CompilationResult } from '@stylify/stylify';
import { getOptions } from 'loader-utils';

export default function (source: string): string {
	if (source.includes('<style id="stylify-css">')) {
		return source;
	}

	const {
		compiler,
		getCompilationResult,
		setCompilationResult,
		addBundleStats
	} = getOptions(this);

	const compilationResult: CompilationResult = compiler.compile(source);
	const completeCompilationResult = getCompilationResult();

	if (completeCompilationResult) {
		completeCompilationResult.configure(compilationResult.serialize());
	}

	setCompilationResult(completeCompilationResult ? completeCompilationResult : compilationResult);
	const css = compilationResult.generateCss();

	if (compiler.mangleSelectors) {
		source = compiler.rewriteSelectors(source, compilationResult) as string;
	}

	if (css) {
		source += `<style id="stylify-css">${css}</style>`;
		addBundleStats({
			resourcePath: this.resourcePath,
			css: css
		});
	}

	return source;
}
