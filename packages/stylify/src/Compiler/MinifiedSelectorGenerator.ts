export class MinifiedSelectorGenerator {
	private readonly letters = 'abcdefghijklmnopqrstuvwxyz';

	private readonly lettersLength = this.letters.length;

	private readonly lastLetterIndex = this.lettersLength - 1;

	private processedSelectors: Record<string, string> = {};

	public getSelector(selector: string) {
		if (!(selector in this.processedSelectors)) {
			this.processedSelectors[selector] = this.divideLengthAndGetLetter(
				Object.keys(this.processedSelectors).length
			);
		}

		return this.processedSelectors[selector];
	}

	private divideLengthAndGetLetter(length: number): string {
		let shortSelector = '';

		if (length > this.lastLetterIndex) {
			const flooredModulus = Math.floor(length / this.lettersLength);
			const modulusLetterId = flooredModulus - 1;
			const difference = length - this.lettersLength * flooredModulus;
			shortSelector = this.letters[difference];
			shortSelector = modulusLetterId > this.lastLetterIndex
				? this.divideLengthAndGetLetter(modulusLetterId) + shortSelector
				: this.letters[modulusLetterId] + shortSelector;
		} else {
			shortSelector = this.letters[length];
		}

		return shortSelector;
	}
}

export const minifiedSelectorGenerator = new MinifiedSelectorGenerator();
