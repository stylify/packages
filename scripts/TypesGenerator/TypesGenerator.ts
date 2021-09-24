import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { argumentsProcessor } from '../ArgumentsProcessor';

interface TypesGeneratorPackageConfigInterface {
	targetFile: string,
	jsx: false | boolean
}

export class TypesGenerator {

	private defaultPackageConfig: TypesGeneratorPackageConfigInterface = {
		targetFile: path.join('src', 'index.ts'),
		jsx: false
	}

	constructor(config: Record<string, Partial<TypesGeneratorPackageConfigInterface> | null>) {
		for (const packageName in config) {
			if (!argumentsProcessor.canProcessPackage(packageName)) {
				return;
			}

			const packageConfig = {...this.defaultPackageConfig, ...config[packageName] || {}};
			this.generateTypesForPackage(packageName, packageConfig);
		}
	}

	private purgeTypesDirectory(packageName): void {
		const directoryToPrepare = path.join('packages', packageName, 'types');
		if (fs.existsSync(directoryToPrepare)) {
			fs.rmdirSync(directoryToPrepare, { recursive: true });
		}
	}

	private generateTypesForPackage(packageName: string, config: TypesGeneratorPackageConfigInterface): void {
		const packageDir = path.join('packages', packageName);
		const inputFile = path.join(packageDir, config.targetFile);
		const jsx = config.jsx ? '--jsx react-jsx --jsxImportSource preact' : '';
		const outputDir = path.join(packageDir, 'types');

		const cmd = `
			yarn tsc ${inputFile}
			--d
			--moduleResolution node
			--emitDeclarationOnly
			--allowSyntheticDefaultImports
			--target esnext
			--outDir ${outputDir}
			${jsx}
		`;

		this.purgeTypesDirectory(packageName);
		exec(cmd.replace(/\n/g, ' '));
	}
}
