import { defineConfig } from '../../lib/index.cjs';

export default {
	components: true,
	buildModules: [
		__dirname + '/../../lib/index.cjs'
	],
	stylify: defineConfig({
		configPath: 'stylify.custom.config.js',
		extend: {
			compiler: {
				variables: {
					red: 'darkred'
				},
				macros: {
					'clr:(\\S+?)': function (macroMatch, cssProperties) {
						// color:blue => will create => color: blue
						// You can also use addMultiple({})
						cssProperties.add('color', macroMatch.getCapture(0));
					}
				}
			}
		}
	})
};
