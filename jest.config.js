module.exports = {
	verbose: true,
	testRegex: 'packages/[^/]+/tests/jest/.*\\.test.ts$',
	testEnvironment: 'jest-environment-jsdom',
	moduleFileExtensions: [
		"js",
		"ts",
		"tsx",
		"mjs"
	],
	preset: 'ts-jest',
	transform: {
		'^.+\\.(js|ts|tsx|mjs)?$': 'ts-jest'
	},
	moduleNameMapper: {
		"\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "tests/jest/__mocks/fileMock.js",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy"
	},
	collectCoverageFrom: [
		'packages/(autoprefixer|stylify)/src/**/*.ts'
	],
	coveragePathIgnorePatterns: [
		'packages/stylify/src/(Stylify.native.browser|Stylify.browser|Runtime|Profiler.browser|Stylify).ts'
	]
};
