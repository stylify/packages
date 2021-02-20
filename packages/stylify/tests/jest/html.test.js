import fs  from 'fs';
import path from 'path';
import { SelectorsRewriter, Compiler } from './../../es5/index.js';
import { compilerConfig } from './../../es5/Configurations/NativeConfiguration.js';

const __dirname = path.join(path.resolve(), 'tests', 'jest');
const inputIndex = fs.readFileSync(path.join(__dirname, 'html', 'input', 'index.html'), 'utf8');
const inputAbout = fs.readFileSync(path.join(__dirname, 'html', 'input', 'about.html'), 'utf8');

compilerConfig.dev = true;
compilerConfig.mangleSelectors = true;
const compiler = new Compiler(compilerConfig);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);
compilationResult = compiler.compile(inputAbout, compilationResult);

// Expected
const expectedGeneratedCss = fs.readFileSync(path.join(__dirname, 'html', 'expected', 'css.css'), 'utf8');
const expectedRewrittenIndex = fs.readFileSync(path.join(__dirname, 'html', 'expected', 'index.html'), 'utf8');
const expectedRewrittenAbout = fs.readFileSync(path.join(__dirname, 'html', 'expected', 'about.html'), 'utf8');

// Output
const generatedCss = compilationResult.generateCss();
const rewrittenIndex =  SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex);
const rewrittenAbout =  SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputAbout);

fs.writeFileSync(__dirname + '/../../tmp/css.css', generatedCss);
fs.writeFileSync(__dirname + '/../../tmp/outputIndex.html', rewrittenIndex);
fs.writeFileSync(__dirname + '/../../tmp/outputAbout.html', rewrittenAbout);

test('Two HTML files build with selectors rewriter', () => {
  expect(generatedCss).toBe(expectedGeneratedCss);
  expect(rewrittenIndex).toBe(expectedRewrittenIndex);
  expect(rewrittenAbout).toBe(expectedRewrittenAbout);
});
