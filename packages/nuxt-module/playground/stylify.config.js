export default {
	sassVarsDirPath: './',
	extend: {
		compiler: {
			components: {
				button: 'test'
			}
		},
		loaders: [
			{ test: /\.md/}
		]
	}
};
