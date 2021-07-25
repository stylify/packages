import { CompilationResult } from '.';

class SelectorsRewriter {

	public rewrite = (compilationResult : CompilationResult, regExp: RegExp, content: string): string => {
		const classReplacementMap = {};
		let match: string[];
		const sortedOSelectorsListKeys = Object
			.keys(compilationResult.selectorsList)
			.sort((a, b) => b.length - a.length);

		while ((match = regExp.exec(content))) {
			let modifiedClassMatch = match[0];

			sortedOSelectorsListKeys.forEach(selector => {
				modifiedClassMatch = modifiedClassMatch.replace(
					new RegExp(selector, 'g'),
					compilationResult.selectorsList[selector].mangledSelector
				);
			});

			classReplacementMap[match[0]] = modifiedClassMatch;
		}

		Object.keys(classReplacementMap).forEach(classToReplace => {
			const classToReplaceRegex = new RegExp(classToReplace, 'g');
			content = content.replace(classToReplaceRegex, classReplacementMap[classToReplace]);
		});

		return content;
	}

}

export default new SelectorsRewriter();
