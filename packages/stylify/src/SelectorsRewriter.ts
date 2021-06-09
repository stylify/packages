import CompilationResult  from "./Compiler/CompilationResult";

class SelectorsRewriter {

	public rewrite = (compilationResult: CompilationResult, regExp: RegExp, content: string): string => {
		let classReplacementMap = {};
		const selectorsMap = compilationResult.processedSelectors;
		const matches = content.match(regExp)
		
		for (const match of matches) {
			let modifiedClassMatch = match;
			//seřazení podle délky aby delší selektory byly před kratšímy
			//pořadí background-color:white -> color:white || nedojde k chybě
			Object.keys(selectorsMap).sort((a,b) => b.length - a.length).forEach(selector => {
				modifiedClassMatch = modifiedClassMatch.replace(new RegExp(selector, 'gi'), selectorsMap[selector]);
			});
			classReplacementMap[match] = modifiedClassMatch;
		}

		Object.keys(classReplacementMap).forEach(classToReplace => {
			const classToReplaceRegex = new RegExp(classToReplace, "g");
			content = content.replace(classToReplaceRegex, classReplacementMap[classToReplace]);
		});

		return content;
	}

}

export default new SelectorsRewriter();
