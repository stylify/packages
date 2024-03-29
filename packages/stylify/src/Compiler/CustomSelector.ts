export type CustomSelectorTreeItemListType = Record<string, CustomSelectorTreeItemInterface>;

export interface CustomSelectorTreeItemInterface {
	selectors: string,
	children: CustomSelectorTreeItemListType;
}

export type GeneratedSelectorsType = Record<string, string>;

export class CustomSelector {

	private readonly placeholderCharacter = '&';

	private readonly placeholderCharacterRegExp = new RegExp(this.placeholderCharacter, 'g');

	private generatedSelectors: Record<string, GeneratedSelectorsType> = {};

	private tree!: CustomSelectorTreeItemInterface;

	constructor(content: string) {
		this.parseTree(content);
	}

	public generateSelectors(rootSelector = ''): GeneratedSelectorsType {
		if (rootSelector in this.generatedSelectors) {
			return this.generatedSelectors[rootSelector];
		}

		const selectors = {};

		const replaceRootPlaceholder = (selector: string, rootSelector: string): string => selector.replace(
			this.placeholderCharacterRegExp,
			rootSelector
		);

		const processTree = (selectorToAdd: string, tree: CustomSelectorTreeItemInterface) => {
			for (const [key, selectorsOrChildren] of Object.entries(tree)) {
				if (key === 'selectors') {
					if (!selectorsOrChildren.length) {
						continue;
					}

					selectors[selectorToAdd] = [selectors[selectorToAdd] ?? '', selectorsOrChildren].join(' ');
					continue;
				}

				for (const [selector, childTree] of Object.entries(tree.children)) {
					for (const selectorSplitPart of selector.split(',')) {
						let actualTreeSelector = selectorToAdd;
						const selectorIncludesPlaceholder = selectorSplitPart.includes('&');

						if (selectorIncludesPlaceholder) {
							actualTreeSelector = `${selector.startsWith(this.placeholderCharacter) ? ' ' : ''}${replaceRootPlaceholder(selectorSplitPart, actualTreeSelector)}`;

						} else {
							actualTreeSelector += ` ${replaceRootPlaceholder(
								selectorIncludesPlaceholder ? selectorSplitPart.substring(1) : selectorSplitPart,
								actualTreeSelector
							)}`;
						}

						processTree(actualTreeSelector.trim(), childTree);
					}
				}
			}
		};

		processTree(rootSelector, this.tree);

		this.generatedSelectors[rootSelector] = selectors;

		return selectors;
	}

	private parseTree(content: string): void {
		const createTree = (): CustomSelectorTreeItemInterface => ({
			selectors: '',
			children: {}
		});

		let contentIterator = 0;
		const contentlength = content.length;

		const parseContent = (
			content: string,
			actualTree: CustomSelectorTreeItemInterface
		): CustomSelectorTreeItemInterface => {
			let tokenQueue = '';

			while (contentIterator < contentlength) {
				const character = content[contentIterator];
				contentIterator ++;

				if (character === '{') {
					const nestedTreeSelector = tokenQueue.match(/(?:\n|^)([^\n]+)$/);
					if (!nestedTreeSelector) {
						throw new Error(`Selector levels cannot be created without selector. Processing "${content}".`);
					}
					actualTree.selectors += tokenQueue.replace(nestedTreeSelector[0], '');
					tokenQueue = '';
					actualTree.children[nestedTreeSelector[1].trim()] = parseContent(content, createTree());

				} else if (character === '}') {
					actualTree.selectors += tokenQueue;
					break;

				} else {
					tokenQueue += character;

					if (contentIterator === contentlength) {
						actualTree.selectors += tokenQueue;
						tokenQueue = '';
						break;
					}
				}
			}

			return actualTree;
		};

		this.tree = parseContent(content, createTree());
	}

}
