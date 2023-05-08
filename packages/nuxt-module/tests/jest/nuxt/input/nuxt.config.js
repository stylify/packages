import { defineConfig } from '../../lib/index.cjs';

export default {
	components: true,
	buildModules: [
		__dirname + '/../../lib/index.cjs'
	],
	stylify: defineConfig({
		configPath: 'stylify.custom.config.js',
		compiler: {
			variables: {
				red: 'darkred'
			},
			macros: {
				'clr:(\\S+?)': function (match) {
					// color:blue => will create => color: blue
					// You can also use addMultiple({})
					return {'color': match.getCapture(0)};
				}
			}
		}
	})
};
