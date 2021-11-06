export class MacroMatch {

	public fullMatch: string = null;

	public screenAndPseudoClassesMatch: string = null;

	public selector: string = null;

	public screen = '_';

	public pseudoClasses: string[] = [];

	public captures: string[] = [];

	constructor(match: string[], screens: Record<string, any>) {
		this.fullMatch = match[0].trim();
		this.screenAndPseudoClassesMatch = typeof match[1] === 'undefined' ? null : match[1].trim();
		this.selector = this.fullMatch;
		this.pseudoClasses = [];
		match.splice(0, 2);
		this.captures = match.filter(matchToFilter => typeof matchToFilter !== 'undefined');

		if (this.screenAndPseudoClassesMatch) {
			const screenAndPseudoClassesMatchArray = this.screenAndPseudoClassesMatch.split(':');
			let possibleScreenMatch = screenAndPseudoClassesMatchArray[0]
				.replace(/&&/ig, ' and ')
				.replace(/\|\|/ig, ', ');

			let screenMatched = false;

			for (const key in screens) {
				const screenRegExp = new RegExp(key, 'g');
				const screenMatches = screenRegExp.exec(possibleScreenMatch);

				if (screenMatches === null) {
					continue;
				}

				possibleScreenMatch = possibleScreenMatch.replace(
					screenRegExp,
					typeof screens[key] === 'function' ? screens[key](screenMatches[0]) : screens[key]
				);
				screenMatched = true;
			}

			if (screenMatched) {
				this.screen = possibleScreenMatch;
				screenAndPseudoClassesMatchArray.shift();
			}

			this.pseudoClasses = screenAndPseudoClassesMatchArray;
		}
	}

	public hasCapture(index: number|string): boolean {
		return typeof this.captures[index] !== 'undefined';
	}

	public getCapture(index: number|string, defaultValue = ''): string {
		return this.hasCapture(index)
			? this.captures[index].replace(/__/g, ' ').replace(/,,/g, '\'') as string
			: defaultValue;
	}

}
