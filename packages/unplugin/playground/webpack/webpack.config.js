const path = require('path');
const { stylifyWebpack } = require('../lib');

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
			bundles: [
				{
					outputFile: './index.css',
					files: ['./index.html']
				}
			]
		})
	],

	mode: 'development',

	output: {
		path: path.join(__dirname),
		filename: 'main.js',
		libraryTarget: 'umd'
	}
};
