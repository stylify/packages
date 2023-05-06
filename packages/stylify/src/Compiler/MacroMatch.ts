import { HelpersType, ScreensType, VariablesType } from './Compiler';
import { RegExpMatch } from './RegExpMatch';

export type CharacterAliasTypeOptions = 'quote' | 'space';

export class MacroMatch extends RegExpMatch {

	public static readonly selectorSpaceAlias = '_';

	public static readonly selectorQuoteAlias = '^';

	private static readonly logicalOperandsReplacementMap = {
		'&&': ' and ',
		'||': ', '
	};

	private static readonly logicalOperandsList = Object.keys(MacroMatch.logicalOperandsReplacementMap);

	public selector: string = null;

	public screen = '_';

	public pseudoClasses: string = null;

	/**
	 * Match
	 * [0] => Full match with spaces
	 * [1] => Full match trimmed
	 * [2] => Pseudo classes and screens
	 * [3] => Property
	 * [4] => Value
	 */
	constructor(match: string[], screens: ScreensType, dev: boolean, variables: VariablesType, helpers: HelpersType) {
		super(match[1], match.slice(3));
		const screenAndPseudoClassesMatch = match[2]?.trim() ?? null;
		this.selector = this.fullMatch;

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
			const nextSequenceIsLogicalSeparator = MacroMatch.logicalOperandsList.includes(nextSequence);
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
					screenData = screenData({
						match: new RegExpMatch(screenMatches[0], screenMatches),
						dev,
						variables,
						helpers
					});
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
				screensAndPseudoClassesParts.push(MacroMatch.logicalOperandsReplacementMap[nextSequence]);
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
			content = content.replace(
				new RegExp(`(\\\\)?\\${characterToReplace}`, 'g'),
				(fullMatch, escapeCharacter) => {
					return escapeCharacter ? fullMatch.replace(/\\/, '') : replacement;
				}
			);
		}

		return content;
	}

	public getCapture(index: number|string, defaultValue = ''): string {
		const capture = super.getCapture(index);
		return capture === undefined ? defaultValue : MacroMatch.replaceCharactersAliases(capture);
	}

}
