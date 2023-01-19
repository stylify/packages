import { ScreensType } from './Compiler';

export type CharacterAliasTypeOptions = 'quote' | 'space';

export class MacroMatch {

	public static readonly selectorSpaceAlias = '_';

	public static readonly selectorQuoteAlias = '^';

	public fullMatch: string = null;

	public screenAndPseudoClassesMatch: string = null;

	public selector: string = null;

	public screen = '_';

	public pseudoClasses: string[] = [];

	public captures: string[] = [];

	constructor(match: string[], screens: ScreensType) {
		this.fullMatch = match[0].trim();
		this.screenAndPseudoClassesMatch = match[1]?.trim() ?? null;
		this.selector = this.fullMatch;
		this.pseudoClasses = [];
		match.splice(0, 2);
		this.captures = match.filter(matchToFilter => typeof matchToFilter !== 'undefined');

		if (this.screenAndPseudoClassesMatch) {
			const screenAndPseudoClassesMatchArray = this.screenAndPseudoClassesMatch.split(':');
			const operators: string[] = [];
			const possibleScreenMatchItems = screenAndPseudoClassesMatchArray[0]
				.replace(/&&/ig, () => {
					operators.push(' and ');
					return '__OPERATOR__';
				})
				.replace(/\|\|/ig, () => {
					operators.push(', ');
					return '__OPERATOR__';
				})
				.split('__OPERATOR__');

			let screenMatched = false;
			let possibleScreenMatchString = '';

			possibleScreenMatchItems.forEach((possibleScreenMatch) => {
				for (const key in screens) {
					const screenRegExp = new RegExp(`\\b${key}$`, 'g');
					const screenMatches = screenRegExp.exec(possibleScreenMatch);

					if (screenMatches === null) {
						continue;
					}

					let screenData = screens[key];

					if (typeof screenData === 'function') {
						screenData = screenData(screenMatches[0]);
					}

					possibleScreenMatch = possibleScreenMatch.replace(screenRegExp, screenData);
					screenMatched = true;
				}

				const operator = operators[0] ?? '';

				if (operator) {
					operators.shift();
				}

				possibleScreenMatchString += `${possibleScreenMatch}${operator}`;
			});

			if (screenMatched) {
				this.screen = possibleScreenMatchString;
				screenAndPseudoClassesMatchArray.shift();
			}

			this.pseudoClasses = screenAndPseudoClassesMatchArray;
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
