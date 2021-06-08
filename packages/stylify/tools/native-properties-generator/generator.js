const path = require('path');
const fs = require('fs');
const prettier = require('prettier');

const dirname = path.join(process.cwd(), 'tools', 'native-properties-generator');

const browserPropertiesListPath = path.join(dirname, 'tmp', 'complete-propertes-list.txt');
const macroFunctionTemplatePath = path.join(dirname, 'templates', 'function.js');
const nativeConfigOutFilePath = path.join(dirname, '..', '..', 'src', 'Configurations', 'NativeConfiguration.ts');
const nativeConfigurationOutputFilePath = nativeConfigOutFilePath;
const nativeConfigurationConfigTemplateFilePath = path.join(dirname, 'templates', 'config.js');

class NativePropertiesGenerator {
	constructor() {
		this.propertiesMap = {};
	}

	generate() {
		const listsDirectoryPath = path.join(dirname, 'lists');
		let listsFilesContent = '';

		const lists = fs.readdirSync(listsDirectoryPath);
		lists.forEach((file) => {
			listsFilesContent += fs.readFileSync(path.join(dirname, 'lists', file), 'utf8') + '\n';
		});

		let propertiesShortcuts = [
			'background',
			'border',
			'border-radius',
			'border-left',
			'border-right',
			'border-top',
			'border-bottom',
			'flex',
			'font',
			'list-style',
			'margin',
			'padding'
		];

		const re = new RegExp(/^[\w-]+/, 'gm');
		let propertyMatch;

		while (propertyMatch = re.exec(listsFilesContent)) {
			let property = propertyMatch[0];

			if (propertiesShortcuts.indexOf(property) > -1) {
				continue;
			}

			propertiesShortcuts.push(property);
		}

		propertiesShortcuts.sort().forEach((property) => {
			this.assignPropertyToPropertiesMap(property);
		});

		const processedPropertiesRegExpString = this.convertMapIntoRegularExpression(this.propertiesMap);
		const propertiesRegExp = '(' + processedPropertiesRegExpString + ')\\\\b:(\\\\S+)';

		fs.writeFileSync(browserPropertiesListPath, propertiesShortcuts.join('\n'));

		const macrosTemplate = this.generateTemplate(
			fs.readFileSync(macroFunctionTemplatePath, 'utf-8'),
			{
				__REG_EXP__: propertiesRegExp
			}
		);

		fs.writeFileSync(
			nativeConfigurationOutputFilePath,
			this.generateTemplate(
				fs.readFileSync(nativeConfigurationConfigTemplateFilePath, 'utf-8'),
				{
					__SIDES_SHORTCUTS__: JSON.stringify(this.sidesShortcuts),
					__SIZES_SHORTCUTS__: JSON.stringify(this.sizesShortcuts),
					__MACROS__: macrosTemplate
				},
				true
			)
		);
	}

	assignPropertyToPropertiesMap(property) {
		let keyPath = property.split('-');
		let key;
		let lastKeyIndex = keyPath.length - 1;
		let object = this.propertiesMap;
		let i;

		for (i = 0; i < lastKeyIndex; ++i) {
			key = keyPath[i];
			const keyInObject = key in object;
			if (!keyInObject) {
				object[key] = {};
			} else if (keyInObject && object[key] === true) {
				object['_' + key] = true;
				object[key] = {};
			}

			object = object[key];
		}

		object[keyPath[lastKeyIndex]] = true;
	}

	convertMapIntoRegularExpression(map) {
		let regExpString = '';
		const keys = Object.keys(map).filter((key) => {
			return !key.startsWith('_');
		});
		const keysLength = keys.length;
		let iteration = 0;

		keys.forEach((key) => {
			iteration += 1;
			const value = map[key];
			const keyShortHandIdentificator = '_' + key;
			const canBeShorthand = keyShortHandIdentificator in map;
			const keyIsShorthand = key.startsWith('_');

			if (value !== true) {
				const valueKeys = Object.keys(value);
				if (!keyIsShorthand) {
					regExpString += key;
				}

				if (!canBeShorthand) {
					regExpString += '-';
				}

				if (valueKeys.length > 1 || value[valueKeys[0]] !== true) {
					if (canBeShorthand) {
						regExpString += '(?:-';
					}

					regExpString
						+= '(?:' + this.convertMapIntoRegularExpression(value) + ')';

					if (canBeShorthand) {
						regExpString += ')?';
					}
				} else if (!keyIsShorthand) {
					if (canBeShorthand) {
						regExpString += '(?:-' + valueKeys[0] + ')?';
					} else {
						regExpString += valueKeys[0];
					}
				}
			} else if (!keyIsShorthand) {
				regExpString += key;
			}

			if (iteration !== keysLength && !keyIsShorthand) {
				regExpString += '|';
			}
		});

		return regExpString;
	}

	generateTemplate(template, values, prettierEnabled = false) {

		Object.keys(values).forEach((key) => {
			const value = values[key];

			template = template.replace(key, value);
		});

		if (prettierEnabled) {
			template = prettier.format(template);
		}

		return template;
	}
}

new NativePropertiesGenerator().generate();
