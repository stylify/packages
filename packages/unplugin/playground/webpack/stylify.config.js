const { defineConfig } = require(__dirname + '/../../lib/index.cjs');

module.exports = defineConfig(() => {
	return {
		bundles: [
			{
				outputFile: './index.css',
				files: ['./index.html']
			}
		]
	};
});
