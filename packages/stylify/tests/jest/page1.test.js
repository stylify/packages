import fs  from 'fs';
import path from 'path';
import { SelectorsRewriter, Compiler } from './../../es5/index.js';
import { compilerConfig } from './../../es5/Configurations/NativeConfiguration.js';

const __dirname = path.join(path.resolve(), 'tests', 'jest');
const inputIndex = fs.readFileSync(path.join(__dirname, 'page1', 'input', 'index.html'), 'utf8');

compilerConfig.dev = true;
compilerConfig.mangleSelectors = true;
const compiler = new Compiler(compilerConfig);
const compilerRegExp = compiler.classMatchRegExp;
let compilationResult = compiler.compile(inputIndex);

// Expected
const expectedGeneratedCss = fs.readFileSync(path.join(__dirname, 'page1', 'expected', 'css.css'), 'utf8');
const expectedRewrittenIndex = fs.readFileSync(path.join(__dirname, 'page1', 'expected', 'index.html'), 'utf8');

// Output
const generatedCss = compilationResult.generateCss();
const rewrittenIndex =  SelectorsRewriter.rewrite(compilationResult, compilerRegExp, inputIndex);

fs.writeFileSync(__dirname + '/../../tmp/cssPage1.css', generatedCss);
fs.writeFileSync(__dirname + '/../../tmp/outputIndexPage1.html', rewrittenIndex);

test('Two HTML files build with selectors rewriter', () => {
  expect(generatedCss).toBe(expectedGeneratedCss);
  expect(rewrittenIndex).toBe(expectedRewrittenIndex);
});
