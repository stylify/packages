const path = require('path');
const fs = require('fs');

const dirname = path.join(process.cwd(), 'packages', 'stylify', 'tools', 'default-preset-generator');

const browserPropertiesListPath = path.join(dirname, 'lists', 'complete-properties-list.txt');
const nativePresetOutputFilePath = path.join(dirname, '..', '..', 'src', 'Compiler', 'defaultPreset.ts');
const nativePresetTemplateFilePath = path.join(dirname, 'template.ts');

class NativePresetGenerator {
	constructor() {
		this.propertiesMap = {};
	}

	generate() {
		const listsDirectoryPath = path.join(dirname, 'lists');
		let listsFilesContent = '';

		const lists = fs.readdirSync(listsDirectoryPath);
		lists.forEach((file) => {
			listsFilesContent += `${fs.readFileSync(path.join(dirname, 'lists', file), 'utf8')} \n`;
		});

		const re = new RegExp(/^[\w-]+/, 'gm');
		let propertyMatch;

		const propertiesList = [];

		while ((propertyMatch = re.exec(listsFilesContent))) {
			let property = propertyMatch[0];
			property = property.replace(/^[^\w]+/, '');

			if (propertiesList.includes(property)) {
				continue;
			}

			propertiesList.push(property);
		}

		const propertiesMap = {};
		propertiesList.sort().forEach((property) => {
			this.assignPropertyToPropertiesMap(propertiesMap, property);
		});

		const propertiesRegExp = `(${this.convertMapIntoRegularExpression(propertiesMap)}):(\\\\S+?)`;

		fs.writeFileSync(browserPropertiesListPath, propertiesList.join('\n'));

		fs.writeFileSync(
			nativePresetOutputFilePath,
			this.generateTemplate(
				fs.readFileSync(nativePresetTemplateFilePath, 'utf-8'),
				{
					__SIDES_SHORTCUTS__: JSON.stringify(this.sidesShortcuts),
					__SIZES_SHORTCUTS__: JSON.stringify(this.sizesShortcuts),
					__PROPERTIES_REG_EXP__: propertiesRegExp
				}
			)
		);
	}

	/**
	 * @param {string} property
	 */
	assignPropertyToPropertiesMap(map, property) {
		let keyPath = property.split('-');
		let key;
		let lastKeyIndex = keyPath.length - 1;
		let object = map;
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

		return object;
	}

	/**
	 *
	 * @param {Reord<string, any>} map
	 * @returns {string}
	 */
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

	/**
	 *
	 * @param {string} template
	 * @param {Record<string, any>} values
	 * @param {boolean} prettierEnabled
	 * @returns {string}
	 */
	generateTemplate(template, values) {

		Object.keys(values).forEach((key) => {
			template = template.replace(key, values[key]);
		});

		return template;
	}
}

new NativePresetGenerator().generate();
