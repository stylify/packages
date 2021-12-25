import typescript from 'rollup-plugin-typescript2';
import fs from 'fs';
import path from 'path';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from '../package.json';

const typescriptConfig = {
	...fs.readFileSync(path.join(__dirname, '..', 'tsconfig.json'), 'utf8'),
	...{
		exclude: [path.join(__dirname, '..', 'packages')]
	}
};

export default {
	input: path.join(__dirname, 'build.ts'),
	plugins: [
		json(),
		commonjs(),
		nodeResolve(),
		typescript(typescriptConfig)
	],
	external: Object.keys(pkg.devDependencies),
	output: {
		file: path.join(__dirname, 'build.js'),
		format: 'cjs'
	}
};
