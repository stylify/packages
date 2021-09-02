import { CompilationResult } from '.';

class SelectorsRewriter {

	public rewrite(compilationResult : CompilationResult, regExp: RegExp, content: string): string {
		const classReplacementMap = {};
		let match: string[];
		const sortedSelectorsListKeys = Object
			.keys(compilationResult.selectorsList)
			.sort((a, b) => b.length - a.length);

		while ((match = regExp.exec(content))) {
			let modifiedClassMatch = match[0];

			sortedSelectorsListKeys.forEach(selector => {
				modifiedClassMatch = modifiedClassMatch.replace(
					new RegExp(selector.replace(/\|/g, '\\|'), 'g'),
					compilationResult.selectorsList[selector].mangledSelector
				);
			});

			classReplacementMap[match[0]] = modifiedClassMatch;
		}

		Object.keys(classReplacementMap).forEach(classToReplace => {
			const classToReplaceRegex = new RegExp(classToReplace.replace(/\|/g, '\\|'), 'g');
			content = content.replace(classToReplaceRegex, classReplacementMap[classToReplace]);
		});

		return content;
	}

}

export default new SelectorsRewriter();
