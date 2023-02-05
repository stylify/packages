export const dollarPlaceholder = '_DLR_';

export const backslashPlaceholder = '_BSLASH_';

export type TokenizerCallbackType = (data: {
	iterator: number,
	token: string|undefined,
	nextToken: string|undefined,
	previousToken: string|undefined,
	tokensCount: number,
	isLastToken: boolean,
	isFirstToken: boolean
}) => boolean|void;

export const escapeCssSelector = (selector: string, all = false) => {
	const selectorLength = selector.length;
	let result = '';
	const regExp = all ? /[^a-zA-Z0-9]/ : /[.*+?^${}()|[\]\\]/;

	for (let i = 0; i < selectorLength; i++) {
		const char = selector[i];
		const escapeCharacter = '\\';

		if (['-', '_'].includes(char) || !regExp.test(char) || selector[i - 1] === escapeCharacter) {
			result += char;
			continue;
		}

		result += `\\${char}`;
	}

	return result;
};

export const tokenize = (content: string, tokenizerCallback: TokenizerCallbackType): void => {
	const tokens = content.split('');
	const tokensCount = tokens.length;

	for (let i = 0; i < tokensCount; i ++) {
		if (tokenizerCallback({
			token: tokens[i],
			nextToken: tokens[i + 1],
			previousToken: tokens[i - 1],
			iterator: i,
			isLastToken: i + 1 === tokensCount,
			isFirstToken: i === 0,
			tokensCount
		})) {
			break;
		}
	}
};

const dollarPlaceholderRegExp = new RegExp(dollarPlaceholder, 'g');
const backslashPlaceholderRegExp = new RegExp(backslashPlaceholder, 'g');

export const prepareStringForReplace = (content: string) => {

	/*
		This replaces special characters used within regular expression
		so their are not processed during replacing
		$ => because $$ causes $
		\ => because \u or \v for example are predefined character sets
	*/
	return content.replace(/\$/g, dollarPlaceholder).replace(/\\/g, backslashPlaceholder);
};

export const getStringOriginalStateAfterReplace = (content: string) => {
	return content.replace(dollarPlaceholderRegExp, '$$').replace(backslashPlaceholderRegExp, '\\');
};
