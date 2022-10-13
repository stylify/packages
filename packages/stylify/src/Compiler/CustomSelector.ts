export type CustomSelectorTreeItemListType = Record<string, CustomSelectorTreeItemInterface>;

export interface CustomSelectorTreeItemInterface {
	selectors: string,
	children: CustomSelectorTreeItemListType;
}

export class CustomSelector {

	private readonly placeholderCharacter = '&';

	private readonly placeholderCharacterRegExp = new RegExp(this.placeholderCharacter, 'g');

	private tree!: CustomSelectorTreeItemInterface;

	constructor(content: string) {
		this.parseTree(content);
	}

	public generateSelectors(rootSelector = ''): Record<string, string> {
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

					selectors[selectorToAdd] = selectorsOrChildren;
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
								selectorIncludesPlaceholder
									? selectorSplitPart.substring(1)
									: selectorSplitPart, actualTreeSelector
							)}`;
						}

						processTree(actualTreeSelector.trim(), childTree);
					}
				}
			}
		};

		processTree(rootSelector, this.tree);

		return selectors;
	}

	private parseTree(content: string): void {
		const createTree = (): CustomSelectorTreeItemInterface => ({
			selectors: '',
			children: {}
		});

		let contentIterator = 0;
		const contentlength = content.length;

		const parseContent = (content: string, actualTree: CustomSelectorTreeItemInterface): any => {
			let tokenQueue = '';

			while (contentIterator < contentlength) {
				const character = content[contentIterator];
				contentIterator ++;

				if (character === '{') {
					const nestedTreeSelector = tokenQueue.match(/(?:\n|^)([^\n]+)$/);
					if (!nestedTreeSelector) {
						throw new Error(`Selector levels cannot be created without selector. Processing "${content}".`);
					}
					actualTree.selectors += tokenQueue.replace(nestedTreeSelector[0], '').trim();
					tokenQueue = '';
					actualTree.children[nestedTreeSelector[1].trim()] = parseContent(content, createTree());

				} else if (character === '}') {
					actualTree.selectors += tokenQueue.trim();
					break;

				} else {
					tokenQueue += character;

					if (contentIterator === contentlength) {
						actualTree.selectors += tokenQueue.trim();
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
