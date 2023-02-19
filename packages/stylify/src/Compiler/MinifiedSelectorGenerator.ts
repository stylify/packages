
export interface ProcessedSelectorInterface {
	mangledSelector: string,
	prefix: string | null
}

export class MinifiedSelectorGenerator {
	private readonly letters = 'abcdefghijklmnopqrstuvwxyz';

	private readonly lettersLength = this.letters.length;

	private readonly lastLetterIndex = this.lettersLength - 1;

	public processedSelectors: Record<string, ProcessedSelectorInterface> = {};

	public getSelectorPrefix(selector: string): string {
		return this.processedSelectors[selector].prefix ?? '';
	}

	public getStringToMatch(selector: string, addPrefix = false): string {
		return addPrefix ? `${this.processedSelectors[selector].prefix ?? ''}${selector}`: selector;
	}

	public generateMangledSelector(selector: string, prefix: string|null = '.') {
		if (!(selector in this.processedSelectors)) {
			this.processedSelectors[selector] = {
				mangledSelector: this.divideLengthAndGetLetter(
					Object.keys(this.processedSelectors).length
				),
				prefix: prefix
			};
		}

		return this.processedSelectors[selector].mangledSelector;
	}

	public getMangledSelector(selector: string, prefix = '') {
		let mangledSelector = this.processedSelectors[selector]?.mangledSelector ?? null;

		if (mangledSelector && prefix.length) {
			mangledSelector = prefix + mangledSelector;
		}

		return mangledSelector;
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
