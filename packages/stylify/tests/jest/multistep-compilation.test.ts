import { Compiler, hooks } from '../../src';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'multistep-compilation';
const testUtils = new TestUtils('stylify', testName);


test('Multistep Compilation - Checks if utilityShouldBeGenerated:false from component is overriden when found within content', (): void => {
	const compiler = new Compiler({ dev: true, mangleSelectors: true });
	compiler.addComponent('title', 'font-size:32px display:flex');
	const compilationResult = compiler.compile('<div class="title"></div>');
	compiler.compile('<div class="display:flex"></div>', compilationResult);

	testUtils.testCssFileToBe(compilationResult.generateCss());
});
