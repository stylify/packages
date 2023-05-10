import { Compiler } from '../src';

const compiler = new Compiler({
	dev: true,
	mangleSelectors: false,
	selectorsAreas: [
	],
	variables: {

	},
	components: {

	}
});

const content = `

`.trim();

const compilationResult = compiler.compile(content);
console.log('\n\n-------------');
console.log(compiler.rewriteSelectors(content));
console.log(compilationResult.generateCss());
//compilationResult.generateCss()
