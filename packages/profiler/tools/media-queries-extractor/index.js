const fs = require('fs');
const path = require('path');

const tmpDirPath = path.join(__dirname, 'tmp');
const processedFileContent = fs.readFileSync(path.join(__dirname, 'sources', 'facebook.css'), 'utf-8');

const mediaQueries = [...new Set(processedFileContent.match(/@media[^{]+{/ig).map((mediaQuery) => {
	return (/@media([^{]+){/).exec(mediaQuery)[1].trim();
}))];

fs.writeFileSync(path.join(tmpDirPath, 'facebook.json'), JSON.stringify(mediaQueries, null, 2));
