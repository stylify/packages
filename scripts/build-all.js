const { packageNamesToBuild } = require('./build');
const { execSync } = require('child_process');

const packageNamesToBuildCount = packageNamesToBuild.length;

const runBuild = (configKey) => {
	console.log(`yarn ${packageNamesToBuild[configKey].toLowerCase()}:build`);
	execSync(`yarn ${packageNamesToBuild[configKey].toLowerCase()}:build --silent`);

	if (configKey + 1 < packageNamesToBuildCount) {
		runBuild(configKey + 1);
	}
};

runBuild(0);
