module.exports = {
	verbose: true,
	testRegex: 'tests/jest/.*\\.test.(js|ts|tsx|mjs)$',
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
		'src/**/*.ts'
	],
	coveragePathIgnorePatterns: [
		'src/(Stylify.native.browser|Stylify.browser|Runtime|Profiler.browser|Stylify).ts',
		'src/Profiler'
	]
}
