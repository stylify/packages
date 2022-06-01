const packagesToTest = [
	'autoprefixer', 'bundler', 'stylify', 'unplugin'
];

module.exports = {
	verbose: true,
	testRegex: `packages/(${packagesToTest.join('|')})/tests/jest/.*\\.test.ts$`,
	testEnvironment: 'jest-environment-jsdom',
	moduleFileExtensions: ['js', 'ts', 'tsx', 'mjs'],
	preset: 'ts-jest',
	transform: {
		'^.+\\.(js|ts|tsx|mjs)?$': 'ts-jest'
	},
	moduleNameMapper: {
		'\\.(svg|ttf|woff|woff2)$': './tests/jest/__mocks/fileMock.js',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy'
	},
	collectCoverageFrom: [
		`packages/(${packagesToTest.join('|')})/src/**/*.ts`
	],
	coveragePathIgnorePatterns: [
		'packages/stylify/src/(stylify.native.browser|stylify.browser|Runtime|Stylify).ts'
	]
};
