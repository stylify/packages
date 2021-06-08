// @ts-nocheck

/* import { CompilationResult }  from "./Compiler/CompilationResult";
 */

class SelectorsRewriter {

	public rewrite = (compilationResult/* : CompilationResult */, regExp: RegExp, content: string): string => {
		const classReplacementMap = {};
		let originalClassMatch;
		const selectorsMap = compilationResult.processedSelectors;
		regExp.lastIndex = 0;

		while (originalClassMatch = regExp.exec(content)) {
			let modifiedClassMatch: string = originalClassMatch[0];

			Object.keys(selectorsMap).forEach(selector => {
				modifiedClassMatch = modifiedClassMatch.replace(
					new RegExp(selector + '\\b', 'gi'),
					selectorsMap[selector]
				);
			});
			//nebude classReplacement vždy empty object - řádek 9
			classReplacementMap[originalClassMatch[0]] = modifiedClassMatch;
		}

		Object.keys(classReplacementMap).forEach(classToReplace => {
			content = content.replace(classToReplace, classReplacementMap[classToReplace]);
		});

		regExp.lastIndex = 0;
		return content;
	}

}

export default new SelectorsRewriter();
