const compilerConfig = {
	screens: {
		tosm: '@media (max-width: 639px)',
		sm: '@media (min-width: 640px)',
		tomd: '@media (max-width: 767px)',
		md: '@media (min-width: 768px)',
		tolg: '@media (max-width: 1023px)',
		lg: '@media (min-width: 1024px)',
		toxl: '@media (max-width: 1279px)',
		xl: '@media (min-width: 1280px)',
		to2xl: '@media (max-width: 1535px)',
		'2xl': '@media (min-width: 1536px)',
		print: '@media print',
	},
	macros: {
		__MACROS__,
	},
}

export {
	compilerConfig
}
