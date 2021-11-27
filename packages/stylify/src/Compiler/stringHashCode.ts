export const stringHashCode = (text: string): string => {
	let hash = 0;
	let charCode: number;

	if (text.length > 0) {
		for (let i = 0; i < text.length; i++) {
			charCode = text.charCodeAt(i);
			/* eslint-disable no-bitwise */
			hash = (hash << 5) - hash + charCode;
			hash |= 0;
			/* eslint-enable no-bitwise */
		}
	}

	return `_${hash.toString(32).slice(2, 9)}`;
};
