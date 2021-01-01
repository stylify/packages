export default class MacroMatch {

	private fullMatch: string = null;

	private screenAndPseudoClassesMatch: string = null;

	private selector: string = null;

	private screen: string = null;

	private pseudoClasses: string[] = [];

	private captures: string[] = [];

	constructor(match: string[], screensKeys: Record<string, any>) {
		this.fullMatch = match[0];
		this.screenAndPseudoClassesMatch = match[1] || null
		this.selector = '.' + this.fullMatch;
		this.screen = '_';
		this.pseudoClasses = [];
		match.splice(0, 2);
		this.captures = match;
	 	this.captures = match.filter((matchToFilter) => {
			return typeof matchToFilter !== 'undefined'
		});

		if (this.screenAndPseudoClassesMatch) {
			const screenAndPseudoClassesMatchArray = this.screenAndPseudoClassesMatch.split(':');

			if (screensKeys.indexOf(screenAndPseudoClassesMatchArray[0]) > -1) {
				this.screen = screenAndPseudoClassesMatchArray[0];
				screenAndPseudoClassesMatchArray.shift();
			}

			this.pseudoClasses = screenAndPseudoClassesMatchArray;
		}

	}

	public getFullMatch(): string {
		return this.fullMatch;
	}

	public getSelector(): string {
		return this.selector;
	}

	public getScreen(): string {
		return this.screen;
	}

	public hasPseudoClasses(): Boolean {
		return this.getPseudoClasses().length > 0;
	}

	public getPseudoClasses(): string[] {
		return this.pseudoClasses;
	}

	public hasCapture(index: number|string): Boolean {
		return typeof this.captures[index] !== 'undefined';
	}

	public getCapture(index: number|string, defaultValue: string = ''): string|any {
		return this.hasCapture(index) ? this.captures[index].replace(/__/g, ' ') : defaultValue;
	}

	public getCaptures(): string[] {
		return this.captures;
	}

	public getCapturesCount(): number {
		return this.captures.length;
	}

}
