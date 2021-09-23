import { CompilationResult } from '.';

class SelectorsRewriter {

	public static rewrite(compilationResult : CompilationResult, selectorsAttributes: string[], content: string): string {
		const sortedSelectorsListKeys = Object
			.keys(compilationResult.selectorsList)
			.sort((a, b) => b.length - a.length);

		const joinedSelectorAttributes = selectorsAttributes.join('|');
		sortedSelectorsListKeys.forEach((selector) => {
			const mangledSelector = compilationResult.selectorsList[selector].mangledSelector;
			selector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regExp = new RegExp(`(${ joinedSelectorAttributes })="([^"]+)?${selector}([^"]+)?"`, 'g');

			content = content.replace(
				regExp,
				(match, attribute: string, selectorsBefore = '', selectorsAfter = ''): string => {
					return `${attribute}="${selectorsBefore as string}${mangledSelector}${selectorsAfter as string}"`;
				}
			);
		});

		return content;
	}

}

export default SelectorsRewriter;
