const fs = require('fs');
const path = require('path');
import { SelectorsRewriter, Compiler } from './../../lib/index.js';
import { nativePreset} from './../../lib/Presets/NativePreset.js';

const inputIndex = fs.readFileSync(path.join(__dirname, 'page1', 'input', 'index.html'), 'utf8');
const inputAbout = fs.readFileSync(path.join(__dirname, 'page1', 'input', 'about.html'), 'utf8');

nativePreset.compiler.dev = true;
nativePreset.compiler.mangleSelectors = true;
const compiler = new Compiler(nativePreset.compiler);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);
compilationResult = compiler.compile(inputAbout, compilationResult);

// Expected
const expectedGeneratedCss = fs.readFileSync(path.join(__dirname, 'page1', 'expected', 'css.css'), 'utf8');
const expectedRewrittenIndex = fs.readFileSync(path.join(__dirname, 'page1', 'expected', 'index.html'), 'utf8');
const expectedRewrittenAbout = fs.readFileSync(path.join(__dirname, 'page1', 'expected', 'about.html'), 'utf8');

// Output
const generatedCss = compilationResult.generateCss();
const rewrittenIndex =  SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex);
const rewrittenAbout =  SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputAbout);

const tmpTargetDir = path.join(__dirname, '..', '..', 'tmp', 'page1');
fs.mkdirSync(tmpTargetDir, {recursive: true});
fs.writeFileSync(path.join(tmpTargetDir, 'css.css'), generatedCss);
fs.writeFileSync(path.join(tmpTargetDir, 'outputIndex.html'), rewrittenIndex);
fs.writeFileSync(path.join(tmpTargetDir, 'outputAbout.html'), rewrittenAbout);

test('Two HTML files build with selectors rewriter', () => {
	expect(generatedCss).toBe(expectedGeneratedCss);
	expect(rewrittenIndex).toBe(expectedRewrittenIndex);
	expect(rewrittenAbout).toBe(expectedRewrittenAbout);
});
