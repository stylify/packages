const packagesToTest = [
	'astro', 'bundler', 'nuxt', 'nuxt-module', 'stylify', 'unplugin'
];

const packagesDirectoryJoin = packagesToTest.join('|');

module.exports = {
	verbose: true,
	testRegex: `packages/(${packagesDirectoryJoin})/tests/jest/.*\\.test.ts$`,
	testEnvironment: 'jest-environment-jsdom',
	moduleFileExtensions: ['js', 'ts', 'mjs'],
	preset: 'ts-jest',
	transform: {
		'^.+\\.(js|ts|mjs)?$': 'ts-jest'
	},
	moduleNameMapper: {
		'\\.(svg|ttf|woff|woff2)$': './tests/jest/__mocks/fileMock.js',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy'
	},
	collectCoverageFrom: [
		`packages/(${packagesDirectoryJoin})/src/**/*.ts`
	],
	coveragePathIgnorePatterns: [
		'packages/stylify/src/(stylify.native.browser|stylify.browser|Runtime|Stylify).ts'
	]
};
