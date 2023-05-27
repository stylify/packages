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
	collectCoverageFrom: [
		`packages/(${packagesDirectoryJoin})/src/**/*.ts`
	],
	coveragePathIgnorePatterns: [
		'packages/stylify/src/(index.browser|index.browser.iife|Runtime|Stylify).ts'
	]
};
