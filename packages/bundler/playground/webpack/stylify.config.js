const { defineConfig } = require(__dirname + '/../../lib/index.cjs');

module.exports = defineConfig({
	bundles: [
		{
			outputFile: './index.css',
			files: ['./index.html']
		}
	],
	compiler: {
		variables: {

		}
	}
});
