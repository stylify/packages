/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

class SelectorsRewriter {
  constructor() {
    this.rewrite = (compilationResult, regExp, content) => {
      let classReplacementMap = {};
      let originalClassMatch;
      const selectorsMap = compilationResult.processedSelectors;
      regExp.lastIndex = 0;

      while (originalClassMatch = regExp.exec(content)) {
        let modifiedClassMatch = originalClassMatch[0];
        Object.keys(selectorsMap).forEach(selector => {
          modifiedClassMatch = modifiedClassMatch.replace(new RegExp(selector + '\\b', 'gi'), selectorsMap[selector]);
        });
        classReplacementMap[originalClassMatch[0]] = modifiedClassMatch;
      }

      Object.keys(classReplacementMap).forEach(classToReplace => {
        content = content.replace(classToReplace, classReplacementMap[classToReplace]);
      });
      regExp.lastIndex = 0;
      return content;
    };
  }

}

var SelectorsRewriter$1 = new SelectorsRewriter();

export default SelectorsRewriter$1;
