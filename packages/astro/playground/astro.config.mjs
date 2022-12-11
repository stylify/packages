import { defineConfig } from 'astro/config';
import stylify from '@stylify/astro';
import node from '@astrojs/node';
import { hooks } from '@stylify/bundler';
import fastGlob from 'fast-glob';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/** @type { import('@stylify/bundler').BundlerConfigInterface[]} */
const stylifyBundles = [];
const layoutCssLayerName = 'layout';
const pageCssLayerName = 'page';

const getFileCssLayerName = (filePath) => filePath.includes('/pages/') ? pageCssLayerName : layoutCssLayerName;

const createBundle = (file) => {
	const fileName = path.parse(file).name;
	const fileCssLayerName = getFileCssLayerName(file);

	return {
		outputFile: `src/styles/${fileCssLayerName}/${fileName.toLowerCase()}.css`,
		files: [file],
		cssLayer: fileCssLayerName
	};
};

const createBundles = (files) => {
	for (const file of files) {
		stylifyBundles.push(createBundle(file));
	}
};

// 1. Map files in layouts/pages and create bundles
createBundles(fastGlob.sync('src/pages/**/*.astro'));
createBundles(fastGlob.sync('src/layouts/**/*.astro'));

// 2. Init Stylify Astro Integraton
const stylifyIntegration = stylify({
	bundler: {
		id: 'astro',
		// Set CSS @layers order
		cssLayersOrder: {
			// Order will be @layer layout,page;
			order: [layoutCssLayerName, pageCssLayerName].join(','),
			// Layers order will be exported into file with layout @layer
			exportLayer: [layoutCssLayerName]
		}
	},
	bundles: stylifyBundles
});

// 3. Add hook that processes opened files
/** @param { import('@stylify/bundler').BundleFileDataInterface } data */
hooks.addListener('bundler:fileToProcessOpened', (data) => {
	let { content, filePath } = data;

	// 3.1 Only for root files
	if (data.isRoot) {
		const cssFileName = path.parse(filePath).name;
		const cssFilePathImport = `import '/src/styles/${getFileCssLayerName(filePath)}/${cssFileName.toLowerCase()}.css';`;

		if (!content.includes(cssFilePathImport)) {
			if ((/import \S+ from (?:'|")\S+(\/layouts\/\S+)(?:'|");/).test(content)) {
				content = content.replace(
					/import \S+ from (?:'|")\S+\/layouts\/\S+(?:'|");/, `$&\n${cssFilePathImport}`
				);
			} else if ((/^\s*---\n/).test(content)) {
				content = content.replace(/^(\s*)---\n/, `$&${cssFilePathImport}\n`);
			} else {
				content = `---\n${cssFilePathImport}\n---\n${content}`;
			}

			fs.writeFileSync(filePath, content);
		}
	}

	// 3.2 For all files
	const regExp = new RegExp(`import \\S+ from (?:'|")\\S+(\\/components\\/\\S+)(?:'|");`, 'g');
	let importedComponent;
	const importedComponentFiles = [];
	const rootDir = path.dirname(fileURLToPath(import.meta.url));

	while (importedComponent = regExp.exec(content)) {
		importedComponentFiles.push(path.join(rootDir, 'src', importedComponent[1]));
	}

	data.contentOptions.files = importedComponentFiles;
});

// 4. Wait for bundler to initialize and watch for directories
// to create new bundles when a file is added
hooks.addListener('bundler:initialized', ({ bundler }) => {
	// Watch layouts and pages directories
	const dirsToWatchForNewBundles = ['layouts', 'pages'];
	for (const dir of dirsToWatchForNewBundles) {
		const pathToWatch = `src/${dir}`;
		fs.watch(pathToWatch, (eventType, fileName) => {
			const fileFullPath = path.join(pathToWatch, fileName);

			if (eventType !== 'rename' || !fs.existsSync(fileFullPath)) {
				return;
			}

			bundler.bundle([createBundle(fileFullPath)]);
		});
	}
});

export default defineConfig({
	// 5. Add Stylify Astro Integration
	integrations: [stylifyIntegration],
	output: 'server',
	adapter: node(),
	server: {
		host: '0.0.0.0',
		port: 3000
	}
});
