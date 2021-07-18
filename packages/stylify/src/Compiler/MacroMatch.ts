export default class MacroMatch {

	public fullMatch: string = null;

	public screenAndPseudoClassesMatch: string = null;

	public selector: string = null;

	public screen: string = null;

	public pseudoClasses: string[] = [];

	public captures: string[] = [];

	constructor(match: string[], screensKeys: Record<string, any>) {
		this.fullMatch = match[0];
		this.screenAndPseudoClassesMatch = match[1] || null;
		this.selector = this.fullMatch;
		this.screen = '_';
		this.pseudoClasses = [];
		match.splice(0, 2);
		this.captures = match.filter(matchToFilter => typeof matchToFilter !== 'undefined');

		if (this.screenAndPseudoClassesMatch) {
			const screenAndPseudoClassesMatchArray = this.screenAndPseudoClassesMatch.split(':');

			if (screensKeys.indexOf(screenAndPseudoClassesMatchArray[0]) > -1) {
				this.screen = screenAndPseudoClassesMatchArray[0];
				screenAndPseudoClassesMatchArray.shift();
			}

			this.pseudoClasses = screenAndPseudoClassesMatchArray;
		}

	}

	public hasCapture(index: number|string): boolean {
		return typeof this.captures[index] !== 'undefined';
	}

	public getCapture(index: number|string, defaultValue = ''): string {
		return this.hasCapture(index) ? this.captures[index].replace(/__/g, ' ') as string : defaultValue;
	}

}
