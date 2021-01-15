const path = require('path');
const fs = require('fs');
const prettier = require("prettier");

class NativePropertiesGenerator {
	constructor() {
		this.propertiesMap = {};
	}

	generate() {
		const listsDirectoryPath = path.join(__dirname, 'lists')
		let listsFilesContent = ''

		const lists = fs.readdirSync(listsDirectoryPath)
		lists.forEach((file) => {
			listsFilesContent += fs.readFileSync(path.join(__dirname, 'lists', file), 'utf8') + '\n';
		})

		let properties = [
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
			'padding',
		]

		const re = new RegExp(/^[\w-]+/, 'gm')
		let propertyMatch

		while ((propertyMatch = re.exec(listsFilesContent))) {
			let property = propertyMatch[0];

			if (properties.indexOf(property) > -1) {
				continue
			}

			properties.push(property);
		}

		properties.sort().forEach((property) => {
			this.assignPropertyToPropertiesMap(property);
		});

		const processedPropertiesRegExpString = this.convertMapIntoRegularExpression(this.propertiesMap);
		const propertiesRegExp = '(' + processedPropertiesRegExpString + ')\\\\b:(\\\\S+)'

		fs.writeFileSync(path.join(__dirname, 'tmp', 'complete-propertes-list.txt'), properties.join('\n'));

		const macrosTemplate = this.generateTemplate(
			fs.readFileSync(path.join(__dirname, 'templates', 'function.js'), 'utf-8'),
			{
				__REG_EXP__: propertiesRegExp,
			}
		)

		fs.writeFileSync(
			path.join(__dirname, '..', '..', 'src', 'configurations', 'native.ts'),
			this.generateTemplate(
				fs.readFileSync(path.join(__dirname, 'templates', 'config.js'), 'utf-8'),
				{
					__SIDES_SHORTCUTS__: JSON.stringify(this.sidesShortcuts),
					__SIZES_SHORTCUTS__: JSON.stringify(this.sizesShortcuts),
					__MACROS__: macrosTemplate,
				},
				true
			)
		)
	}

	assignPropertyToPropertiesMap(property) {
		let keyPath = property.split('-')
		let key
		let lastKeyIndex = keyPath.length - 1
		let object = this.propertiesMap
		let i

		for (i = 0; i < lastKeyIndex; ++i) {
			key = keyPath[i]
			const keyInObject = key in object
			if (!keyInObject) {
				object[key] = {}
			} else if (keyInObject && object[key] === true) {
				object['_' + key] = true
				object[key] = {}
			}

			object = object[key]
		}

		object[keyPath[lastKeyIndex]] = true
	}

	convertMapIntoRegularExpression(map) {
		let regExpString = ''
		const keys = Object.keys(map).filter((key) => {
			return !key.startsWith('_')
		})
		const keysLength = keys.length
		let iteration = 0

		keys.forEach((key) => {
			iteration += 1
			const value = map[key]
			const keyShortHandIdentificator = '_' + key
			const canBeShorthand = keyShortHandIdentificator in map
			const keyIsShorthand = key.startsWith('_')

			if (value !== true) {
				const valueKeys = Object.keys(value)
				if (!keyIsShorthand) {
					regExpString += key
				}

				if (!canBeShorthand) {
					regExpString += '-'
				}

				if (valueKeys.length > 1 || value[valueKeys[0]] !== true) {
					if (canBeShorthand) {
						regExpString += '(?:-'
					}

					regExpString +=
						'(?:' + this.convertMapIntoRegularExpression(value) + ')'

					if (canBeShorthand) {
						regExpString += ')?'
					}
				} else if (!keyIsShorthand) {
					if (canBeShorthand) {
						regExpString += '(?:-' + valueKeys[0] + ')?'
					} else {
						regExpString += valueKeys[0]
					}
				}
			} else if (!keyIsShorthand) {
				regExpString += key
			}

			if (iteration !== keysLength && !keyIsShorthand) {
				regExpString += '|'
			}
		});

		return regExpString;
	}

	generateTemplate(template, values, prettierEnabled = false) {
		Object.keys(values).forEach((key) => {
			const value = values[key]

			template = template.replace(key, value)
		})

		if (prettierEnabled) {
			template = prettier.format(template)
		}

		return template
	}
}

(new NativePropertiesGenerator()).generate();
