const path = require('path');
const { stylifyWebpack } = require('../../lib/index.cjs');

module.exports = {
	entry: path.join(__dirname, 'index.js'),
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	plugins: [
		stylifyWebpack({
			bundles: [{
				files: [__dirname + '/index.html'],
				outputFile: __dirname + '/index.css'
			}]
		})
	],

	mode: 'development',

	output: {
		path: path.join(__dirname),
		filename: 'main.js',
		libraryTarget: 'umd'
	}
};
