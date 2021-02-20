import fs from 'fs';
import path from 'path';
import { Compiler, SelectorsRewriter, nativeCompilerConfig as compilerConfig } from '@stylify/stylify/lib';

export default function Stylify(moduleOptions) {
	const CONFIG_FILE_NAME = 'stylify.config.js';
	const { nuxt } = this

	let options = {
		configPath: CONFIG_FILE_NAME,
		embeddedCssLimit: 50,
		importStylify: true,
		importProfiler: false,
		// Extend config
		compiler: {},
		runtime: {}
	};
	options.compiler.dev = typeof nuxt.options.dev === "boolean" ? nuxt.options.dev : false;
	options.mangleSelectors = !options.compiler.dev;
	options = Object.assign(options, moduleOptions, nuxt.options.stylify);

	const configPath = nuxt.resolver.resolveAlias(options.configPath);
	if (options.compiler.dev && fs.existsSync(configPath)) {
		options = Object.assign(options, nuxt.resolver.requireModule(configPath));
		nuxt.options.watch.push(configPath);
	}

	const compiler = new Compiler(options.compiler);
	compiler.mangleSelectors = true;
	const cache = {};
	const process = (page, url = null) => {
		if (options.compiler.dev) {
			return;
		}
		const compilationResult = compiler.compile(page.html);
		const css = compilationResult.generateCss();
		const serializedResult = JSON.stringify(compilationResult.serialize());
		const html = page.html.replace('</head>', '<script class="stylify-runtime-cache" type="application/json">' + JSON.stringify(compilationResult.serialize()) + '</script>\n<style id="stylify-css">' + css + '</style>\n</head>');
		page.html = SelectorsRewriter.rewrite(compilationResult, compiler.classMatchRegExp, html);
	};

	/*      const cssPath = nuxt.resolver.resolveAlias(
				path.join(nuxt.options.dir.assets, 'css', 'stylify.css')
			); */
	/* if (fs.existsSync(cssPath)) {
		nuxt.options.css.unshift(cssPath)
	} else {
		nuxt.options.css.unshift(path.resolve(__dirname, 'files', 'stylify.css'))
		} */

	this.addPlugin({
		ssr: false,
		src: path.resolve(__dirname, 'plugin.js'),
		fileName: 'stylify.js',
		options: options
	});

	/* if (options.importProfiler || options.compiler.dev) {
		ModuleContainer.addPlugin(path.resolve(__dirname, '..', 'node_modules', '@stylify', 'stylify', 'dist', 'profiler.js'));
	} */
	/* nuxt.hook('build:done', (builder) => {
		const cssFilePaths = path.join(builder.nuxt.options.buildDir, 'extra-file')
		fs.writeFileSync(extraFilePath, 'Something extra')
	}); */

	nuxt.hook('render:route', (url, page, { req, res }) => {
		process(page, url);
	});
	nuxt.hook('generate:page', page => {
		process(page);
	});
}
