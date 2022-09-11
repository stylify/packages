export const logOrError = (message: string, isProduction: boolean) => {
	if (isProduction) {
		throw new Error(message);
	} else {
		console.warn(message);
	}
};
