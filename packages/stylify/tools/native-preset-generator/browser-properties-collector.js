const cssProperties = Object.keys(new Option().style)
	.map((property) => {
		property = property.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

		if (property.startsWith('webkit')) {
			property = `-${property}`;
		}

		return property;
	})
	.filter((item, index, self) => {
		return self.indexOf(item) === index;
	})
	.sort();

console.log(cssProperties);
