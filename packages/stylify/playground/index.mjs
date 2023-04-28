import { Compiler } from '../esm/index.mjs';

const compiler = new Compiler({
	dev: true,
	mangleSelectors: false,
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
