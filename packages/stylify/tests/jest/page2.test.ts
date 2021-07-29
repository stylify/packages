const fs = require('fs');
const path = require('path');
import { SelectorsRewriter, Compiler } from './../../lib/index.js';
import { nativePreset } from './../../lib/Presets/NativePreset.js';

const inputIndex = fs.readFileSync(path.join(__dirname, 'page2', 'input', 'index.html'), 'utf8');

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);

// Expected
const expectedGeneratedCss = fs.readFileSync(path.join(__dirname, 'page2', 'expected', 'css.css'), 'utf8');
const expectedRewrittenIndex = fs.readFileSync(path.join(__dirname, 'page2', 'expected', 'index.html'), 'utf8');

// Output
const generatedCss = compilationResult.generateCss();
const rewrittenIndex =  SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex);

const tmpTargetDir = path.join(__dirname, '..', '..', 'tmp', 'page2');
fs.mkdirSync(tmpTargetDir, {recursive: true});
fs.writeFileSync(path.join(tmpTargetDir, 'css.css'), generatedCss);
fs.writeFileSync(path.join(tmpTargetDir, 'output-index.html'), rewrittenIndex);

test('Generated css, rewritten HTML', () => {
	expect(generatedCss).toBe(expectedGeneratedCss);
	expect(rewrittenIndex).toBe(expectedRewrittenIndex);
});

