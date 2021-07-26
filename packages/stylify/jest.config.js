module.exports = {
	verbose: true,
	testRegex: 'tests/jest/.*\\.test.(js|ts|tsx|mjs)$',
	testEnvironment: 'jest-environment-jsdom',
	"moduleFileExtensions": [
		"js",
		"ts",
		"tsx",
		"mjs"
	],
	preset: 'ts-jest',
	transform: {
		'^.+\\.(js|ts|tsx|mjs)?$': 'ts-jest'
	}
}
