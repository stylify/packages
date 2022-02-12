export default {
	sassVarsDirPath: './assets',
	extend: {
		compiler: {
			components: {
				button: 'color:blue'
			}
		},
		loaders: [
			{ test: /\.md/}
		]
	}
};
