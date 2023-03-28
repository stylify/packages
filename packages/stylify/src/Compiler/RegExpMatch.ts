export class RegExpMatch {

	public fullMatch: string = null;

	public captures: string[] = [];

	constructor(fullMatch: string, captures: string[]) {
		this.fullMatch = fullMatch.trim();
		this.captures = captures.filter(matchToFilter => typeof matchToFilter !== 'undefined');
	}

	public getCapture(index: number|string, defaultValue: string = undefined): string|undefined {
		return this.captures[index] as string ?? defaultValue;
	}

}
