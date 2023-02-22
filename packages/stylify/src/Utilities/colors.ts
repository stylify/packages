export interface RgbDataInterface {
	r: number | null
	g: number | null
	b: number | null
}

export const lightenDarkenColor = (color: string, amount: number): string => {
	const { r, g, b} = parseColor(color);

	const colors = [r, g, b].map((colorPart: number): number => {
		colorPart += amount;

		if (colorPart > 255) {
			colorPart = 255;
		} else if (colorPart < 0) {
			colorPart = 0;
		}

		return colorPart;
	});

	return rgbToHex({
		r: colors[0],
		g: colors[1],
		b: colors[2]
	});
};

export const parseHex = (color: string): RgbDataInterface => {
	const hex = color.replace('#', '');
	const isHexThreeCharsLong = hex.length === 3;

	return {
		r: parseInt(isHexThreeCharsLong ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16),
		g: parseInt(isHexThreeCharsLong ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16),
		b: parseInt(isHexThreeCharsLong ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16)
	};
};

export const parseRgb = (color: string): RgbDataInterface => {
	color = color.replace('rgb(', '').replace(/\)/, '');
	const colorToArray = color.split(color.includes(',') ? ',' : ' ');

	return {
		r: parseInt(colorToArray[0]),
		g: parseInt(colorToArray[1]),
		b: parseInt(colorToArray[2])
	};
};

export const parseColor = (color: string): RgbDataInterface => {
	let rgbData: RgbDataInterface = {
		r: null,
		g: null,
		b: null
	};

	if ((/^#/).test(color)) {
		rgbData = parseHex(color);

	} else if ((/^rgb\(/).test(color)) {
		rgbData = parseRgb(color);
	}

	if (rgbData.r === null) {
		throw new Error(`Color "${color}" could not be converted to RGB.`);
	}

	return rgbData;
};

export const rgbToHex = (color: string|Record<string, any>) => {
	if (typeof color === 'string') {
		color = parseRgb(color);
	}

	const { r, g, b} = color;
	return '#' + [r, g, b].map((colorPart) => {
		const hex: string = colorPart.toString(16);
		return hex.length == 1 ? `0${hex}` : hex;
	}).join('');
};
