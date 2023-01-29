import { ScreensType } from './Compiler';

export type CharacterAliasTypeOptions = 'quote' | 'space';

export class MacroMatch {

	public static readonly selectorSpaceAlias = '_';

	public static readonly selectorQuoteAlias = '^';

	private readonly logicalOperandsReplacementMap = {
		'&&': ' and ',
		'||': ', '
	};

	private readonly logicalOperandsList = Object.keys(this.logicalOperandsReplacementMap);

	public fullMatch: string = null;

	public selector: string = null;

	public screen = '_';

	public pseudoClasses: string = null;

	public captures: string[] = [];

	constructor(match: string[], screens: ScreensType) {
		this.fullMatch = match[0].trim();
		const screenAndPseudoClassesMatch = match[1]?.trim() ?? null;
		this.selector = this.fullMatch;
		match.splice(0, 2);
		this.captures = match.filter(matchToFilter => typeof matchToFilter !== 'undefined');

		if (!screenAndPseudoClassesMatch) {
			return;
		}

		const screensAndPseudoClassesParts = [];
		const screensAndPseudoClassesTokens = screenAndPseudoClassesMatch.split('');
		const tokensLength = screensAndPseudoClassesTokens.length;

		let tokenQueue = '';
		let screenMatched = false;
		let pseudoClassesPart = screenAndPseudoClassesMatch;

		for (let i = 0; i <= tokensLength; i ++) {
			const token = screensAndPseudoClassesTokens[i];
			const previousToken = screensAndPseudoClassesTokens[i - 1] ?? '';
			const nextToken = screensAndPseudoClassesTokens[i + 1] ?? '';

			const nextSequence = token + nextToken;
			const nextSequenceIsLogicalSeparator = this.logicalOperandsList.includes(nextSequence);
			const nextSequenceIsColonSeparator = token === '\\' && nextToken !== ':';
			const isLastToken = i === tokensLength;

			if (!(nextSequenceIsColonSeparator
				|| nextSequenceIsLogicalSeparator
				|| token === ':' && previousToken !== '\\'
				|| isLastToken
			)) {
				tokenQueue += token;
				continue;
			}

			for (const key in screens) {
				const screenRegExp = new RegExp(`^${key}$`, 'g');
				const screenMatches = screenRegExp.exec(tokenQueue);

				if (screenMatches === null) {
					continue;
				}

				let screenData = screens[key];

				if (typeof screenData === 'function') {
					screenData = screenData(screenMatches[0]);
				}

				if (screenData) {
					pseudoClassesPart = pseudoClassesPart.substring(screenMatches[0].length);
					screensAndPseudoClassesParts.push(screenData);
					screenMatched = true;
					break;
				}
			}

			tokenQueue += token;

			if (nextSequenceIsLogicalSeparator) {
				pseudoClassesPart = pseudoClassesPart.substring(2);
				screensAndPseudoClassesParts.push(this.logicalOperandsReplacementMap[nextSequence]);
				i ++;
				tokenQueue = '';
				continue;
			}
		}

		if (screenMatched) {
			this.screen = screensAndPseudoClassesParts.join('');
		}

		const pseudoClasses = pseudoClassesPart.replace(/^:/, '');

		if (pseudoClasses.trim().length) {
			this.pseudoClasses = pseudoClasses;
		}
	}

	public static replaceCharactersAliases(content: string, alias: CharacterAliasTypeOptions = null) {
		const aliases: Record<CharacterAliasTypeOptions, [string, string]> = {
			space: [MacroMatch.selectorSpaceAlias, ' '],
			quote: [MacroMatch.selectorQuoteAlias, '\'']
		};

		for (const [characterToReplace, replacement] of alias ? aliases[alias] : Object.values(aliases)) {
			content = content.replace(new RegExp(`(\\\\)?\\${characterToReplace}`, 'g'), (fullMatch, escapeCharacter) => {
				return escapeCharacter ? fullMatch.replace(/\\/, '') : replacement;
			});
		}

		return content;
	}

	public hasCapture(index: number|string): boolean {
		return typeof this.captures[index] !== 'undefined';
	}

	public getCapture(index: number|string, defaultValue = ''): string {
		return this.hasCapture(index)
			? MacroMatch.replaceCharactersAliases(this.captures[index] as string)
			: defaultValue;
	}

}
