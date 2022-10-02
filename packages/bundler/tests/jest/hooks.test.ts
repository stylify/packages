import path from 'path';
import fse from 'fs-extra';
import fs from 'fs';
import { Bundler, hooks } from '../../src'
import TestUtils from '../../../../tests/TestUtils';

const testName = 'hooks';
const testUtils = new TestUtils('bundler', testName);

const bundleTestDir = testUtils.getTestDir();
const buildTmpDir = path.join(testUtils.getTmpDir(), testUtils.getTestName() + '-build');

if (!fs.existsSync(buildTmpDir)) {
	fs.mkdirSync(buildTmpDir, {recursive: true});
}

fse.copySync(path.join(bundleTestDir, 'input'), buildTmpDir);

const bundler = new Bundler({ dev: true });

bundler.bundle([
   	{
		id: 'index',
		outputFile: path.join(buildTmpDir, 'index.css'),
		files: [ path.join(buildTmpDir, 'index.html') ],
		compiler: { mangleSelectors: true },
	},
 	{
		id: 'second',
		outputFile: path.join(buildTmpDir, 'second.css'),
		files: [
			path.join(buildTmpDir, 'second.html'),
			path.join(buildTmpDir, 'default.twig'),
		]
	}
]);

hooks.addListener('bundler:beforeCssFileCreated', (data) => {
	const filePathInfo = path.parse(data.bundleConfig.outputFile);
	data.bundleConfig.outputFile = path.join(filePathInfo.dir, filePathInfo.name + '.scss');
	data.content = `/* File content changed during build */\n${data.content}`;
});

hooks.addListener('bundler:bundleProcessed', (data) => {
	const filePathInfo = path.parse(data.bundleConfig.outputFile);
	fs.writeFileSync(path.join(filePathInfo.dir, filePathInfo.name + '.txt'), '')
});

hooks.addListener('bundler:fileToProcessOpened', (data) => {
	const regExp = new RegExp('{% extends "(\\S+)" %}', 'g');
	let match: RegExpMatchArray;

	if (typeof data.contentOptions.files === 'undefined') {
		data.contentOptions.files = [];
	};

	while (match = regExp.exec(data.content)) {
		data.contentOptions.files.push(match[1]);
	}
});

hooks.addListener(
	'bundler:beforeInputFileRewritten',
	(data) => {
		if (data.bundleConfig.id !== 'index') {
			return;
		}

		const filePathInfo = path.parse(data.filePath);
		data.filePath = path.join(filePathInfo.dir, filePathInfo.name + '.html');
		data.content = `<!-- File content changed during build. -->\n${data.content}`;
	}
)

hooks.addListener('bundler:bundleProcessed', (data) => {
	if (data.bundleConfig.id !== 'second') {
		return;
	}

	const filePathInfo = path.parse(data.bundleConfig.outputFile);
	fs.writeFileSync(path.join(filePathInfo.dir, filePathInfo.name + '-modified.txt'), '')
});

test('Bundler - single file', async (): Promise<void> => {
	await bundler.waitOnBundlesProcessed();

	const indexCssOutput = testUtils.readFile(path.join(buildTmpDir, 'index.scss'));
	const secondCssOutput = testUtils.readFile(path.join(buildTmpDir, 'second.scss'));
	const indexHtmlOutput = testUtils.readFile(path.join(buildTmpDir, 'index.html'));
	const secondHtmlOutput = testUtils.readFile(path.join(buildTmpDir, 'second.html'));

	const indexTxtExists = fs.existsSync(path.join(buildTmpDir, 'index.txt'));
	const secondTxtExists = fs.existsSync(path.join(buildTmpDir, 'second-modified.txt'));

 	testUtils.testToBe(indexTxtExists, true);
	testUtils.testToBe(secondTxtExists, true);

	testUtils.testCssFileToBe(indexCssOutput);
	testUtils.testCssFileToBe(secondCssOutput, 'second');

	testUtils.testHtmlFileToBe(indexHtmlOutput);
	testUtils.testHtmlFileToBe(secondHtmlOutput, 'second');
});
