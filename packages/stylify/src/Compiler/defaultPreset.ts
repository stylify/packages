import type { CompilerConfigInterface } from '.';
import { lightenDarkenColor, parseColor } from '../Utilities';

const rangeScreen = (screen: string): string => {
	const ranges = screen.replace('rng', '').split('-');
	return `${minWidthScreen(ranges[0])} and ${maxWidthScreen(ranges[1])}`;
};
const minWidthScreen = (screen: string): string => `(min-width: ${screen.replace('minw', '')})`;
const maxWidthScreen = (screen: string): string => `(max-width: ${screen.replace('maxw', '')})`;
const minHeightScreen = (screen: string): string => `(min-height: ${screen.replace('minh', '')})`;
const maxHeightScreen = (screen: string): string => `(max-height: ${screen.replace('maxh', '')})`;
const orientationScreen = (screen: string): string => `(orientation: ${screen})`;

export const defaultPreset = {
	ignoredAreas: [
		/stylify-ignore([\s\S]*?)\/stylify-ignore/,
		/<code[\s]*?>([\s\S]*?)<\/code>/,
		/<head[\s]*?>([\s\S]*?)<\/head>/,
		/<pre[\s]*?>([\s\S]*?)<\/pre>/,
		/<script[\s]*?>([\s\S]*?)<\/script>/,
		/<style[\s]*?>([\s\S]*?)<\/style>/
	],
	selectorsAreas: [
		// HTML
		/(?:^|\s+)class="([^"]+)"/,
		/(?:^|\s+)class='([^']+)'/,
		// React
		/(?:^|\s+)className="([^"]+)"/,
		/(?:^|\s+)className='([^']+)'/,
		/(?:^|\s+)className=\{((?:.|\n)+)\}/,
		// JSX compiled
		/(?:^|\s+)className:\s*`((?:.|\n)+)`/,
		/(?:^|\s+)className:\s*"([^"]+)"/,
		/(?:^|\s+)className:\s*'([^']+)"/,
		// Vue and alpinejs
		/(?:^|\s+)(?:v-bind|x-bind)?:class="([^"]+)"/,
		/(?:^|\s+)(?:v-bind|x-bind)?:class='([^']+)'/,
		// Lit
		/(?:^|\s+)class=\$\{((?:.|\n)+)\}/,
		// Angular
		/(?:^|\s+)\[(?:ngClass|className)\]="([^"]+)/,
		/(?:^|\s+)\[(?:ngClass|className)\]='([^']+)/,
		// Nette
		/(?:^|\s+)n:class="([^"]+)"/,
		/(?:^|\s+)n:class='([^']+)'/,
		// Twig form widgets
		/'class':\s*'([^']+)'/,
		/'class':\s*"([^"]+)"/,
		/"class":\s*"([^"]+)"/,
		/"class":\s*'([^']+)'/,
		// Escaped default areas
		/(?:^|\s+)class=\\"([^"]+)\\"/,
		/(?:^|\s+)class=\\'([^']+)\\'/,
		// Svelte
		/(?:^|\s+)class:(\S+)=[{"']/,
		/class=\{`([^`]+)`\}/,
		// Objects
		/(?:^|\s+)"class":\s*`([^`]+)`/
	],
	screens: {
		tosm: maxWidthScreen('639px'),
		sm: minWidthScreen('640px'),
		tomd: maxWidthScreen('767px'),
		md: minWidthScreen('768px'),
		tolg: maxWidthScreen('1023px'),
		lg: minWidthScreen('1024px'),
		toxl: maxWidthScreen('1279px'),
		xl: minWidthScreen('1280px'),
		to2xl: maxWidthScreen('1535px'),
		'2xl': minWidthScreen('1536px'),
		to3xl: maxWidthScreen('1919px'),
		'3xl': minWidthScreen('1920px'),
		'minw\\w+': minWidthScreen,
		'maxw\\w+': maxWidthScreen,
		'minh\\w+': minHeightScreen,
		'maxh\\w+': maxHeightScreen,
		'rng[\\d\\w]+-[\\d\\w]+': rangeScreen,
		screen: 'screen',
		print: 'print',
		onlyScreen: 'only screen',
		portrait: orientationScreen('portrait'),
		landscape: orientationScreen('landscape'),
		dark: '(prefers-color-scheme: dark)',
		light: '(prefers-color-scheme: light)'
	},
	macros: {
		// eslint-disable-next-line max-len
		'(accent-color|additive-symbols|align-(?:content|items|self)|alignment-baseline|all|alt|animation(?:-(?:delay|direction|duration|fill-mode|iteration-count|name|play-state|timeline|timing-function))?|app-region|appearance|apple-(?:color-filter|pay-(?:button-(?:style|type))|trailing-word)|ascent-override|aspect-ratio|backdrop-filter|backface-visibility|background(?:-(?:attachment|blend-mode|clip|color|image|origin|position(?:-(?:x|y))?|repeat(?:-(?:x|y))?|size))?|baseline-shift|block-size|border(?:-(?:block(?:-(?:color|end(?:-(?:color|style|width))?|start(?:-(?:color|style|width))?|style|width))?|bottom(?:-(?:color|left-radius|right-radius|style|width))?|collapse|color|end-(?:end-radius|start-radius)|image(?:-(?:outset|repeat|slice|source|width))?|inline(?:-(?:color|end(?:-(?:color|style|width))?|start(?:-(?:color|style|width))?|style|width))?|left(?:-(?:color|style|width))?|radius|right(?:-(?:color|style|width))?|spacing|start-(?:end-radius|start-radius)|style|top(?:-(?:color|left-radius|right-radius|style|width))?|width))?|bottom|box-(?:decoration-break|shadow|sizing)|break-(?:after|before|inside)|buffered-rendering|caption-side|caret-color|clear|clip(?:-(?:path|rule))?|color(?:-(?:adjust|interpolation(?:-filters)?|rendering|scheme))?|column-(?:count|fill|gap|rule(?:-(?:color|style|width))?|span|width)|columns|contain(?:-(?:intrinsic-(?:block-size|height|inline-size|size|width)))?|content(?:-visibility)?|counter-(?:increment|reset|set)|cursor|cx|cy|d|descent-override|direction|display|dominant-baseline|empty-cells|end|fallback|fill(?:-(?:opacity|rule))?|filter|flex(?:-(?:basis|direction|flow|grow|shrink|wrap))?|float|flood-(?:color|opacity)|font(?:-(?:display|family|feature-settings|kerning|language-override|optical-sizing|size(?:-adjust)?|stretch|style|synthesis|variant(?:-(?:alternates|caps|east-asian|ligatures|numeric|position))?|variation-settings|weight))?|forced-(?:color-adjust)|gap|glyph-(?:orientation-(?:horizontal|vertical))|grid(?:-(?:area|auto-(?:columns|flow|rows)|column(?:-(?:end|gap|start))?|gap|row(?:-(?:end|gap|start))?|template(?:-(?:areas|columns|rows))?))?|hanging-punctuation|height|hyphens|image-(?:orientation|rendering)|ime-mode|inherits|initial-value|inline-size|inset(?:-(?:block(?:-(?:end|start))?|inline(?:-(?:end|start))?))?|isolation|justify-(?:content|items|self)|kerning|left|letter-spacing|lighting-color|line-(?:break|gap-override|height(?:-step)?)|list-(?:style(?:-(?:image|position|type))?)|margin(?:-(?:block(?:-(?:end|start))?|bottom|inline(?:-(?:end|start))?|left|right|top))?|marker(?:-(?:end|mid|start))?|mask(?:-(?:clip|composite|image|mode|origin|position(?:-(?:x|y))?|repeat|size|type))?|math-(?:depth|shift|style)|max-(?:block-size|height|inline-size|width|zoom)|min-(?:block-size|height|inline-size|width|zoom)|mix-(?:blend-mode)|moz-(?:appearance|box-(?:align|direction|flex|ordinal-group|orient|pack)|float-edge|force-(?:broken-(?:image-icon))|image-region|orient|outline-(?:radius-(?:bottomleft|bottomright|topleft|topright))|stack-sizing|tab-size|text-(?:size-adjust)|user-(?:focus|input|modify|select)|window-dragging)|negative|object-(?:fit|position)|offset(?:-(?:anchor|distance|path|position|rotate))?|opacity|order|orientation|orphans|outline(?:-(?:color|offset|style|width))?|overflow(?:-(?:anchor|clip-margin|wrap|x|y))?|overscroll-(?:behavior(?:-(?:block|inline|x|y))?)|pad|padding(?:-(?:block(?:-(?:end|start))?|bottom|inline(?:-(?:end|start))?|left|right|top))?|page(?:-(?:break-(?:after|before|inside)|orientation))?|paint-order|perspective(?:-(?:origin(?:-(?:x|y))?))?|place-(?:content|items|self)|pointer-events|position|prefix|quotes|r|range|resize|right|rotate|row-gap|ruby-(?:align|position)|rx|ry|scale|scroll-(?:behavior|margin(?:-(?:block(?:-(?:end|start))?|bottom|inline(?:-(?:end|start))?|left|right|top))?|padding(?:-(?:block(?:-(?:end|start))?|bottom|inline(?:-(?:end|start))?|left|right|top))?|snap-(?:align|margin-(?:bottom|left|right|top)|stop|type))|scrollbar-(?:color|gutter|width)|shape-(?:image-threshold|margin|outside|rendering)|size(?:-adjust)?|source|speak(?:-as)?|src|start|stop-(?:color|opacity)|stroke(?:-(?:color|dasharray|dashoffset|linecap|linejoin|miterlimit|opacity|width))?|suffix|symbols|syntax|system|tab-size|table-layout|text-(?:align(?:-last)?|anchor|combine-upright|decoration(?:-(?:color|line|skip(?:-ink)?|style|thickness))?|emphasis-(?:color|position|style)|indent|justify|orientation|overflow|rendering|shadow|size-adjust|transform|underline-(?:offset|position))|top|touch-action|transform(?:-(?:box|origin(?:-(?:x|y|z))?|style))?|transition(?:-(?:delay|duration|property|timing-function))?|translate|unicode-(?:bidi|range)|user-(?:select|zoom)|vector-effect|vertical-align|visibility|webkit-(?:align-(?:content|items|self)|animation(?:-(?:delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function))?|app-region|appearance|aspect-ratio|backdrop-filter|backface-visibility|background-(?:clip|composite|origin|size)|border-(?:after(?:-(?:color|style|width))?|before(?:-(?:color|style|width))?|bottom-(?:left-radius|right-radius)|end(?:-(?:color|style|width))?|fit|horizontal-spacing|image|radius|start(?:-(?:color|style|width))?|top-(?:left-radius|right-radius)|vertical-spacing)|box-(?:align|decoration-break|direction|flex(?:-group)?|lines|ordinal-group|orient|pack|reflect|shadow|sizing)|clip-path|column-(?:axis|break-(?:after|before|inside)|count|gap|progression|rule(?:-(?:color|style|width))?|span|width)|columns|cursor-visibility|filter|flex(?:-(?:basis|direction|flow|grow|shrink|wrap))?|font-(?:feature-settings|kerning|smoothing)|highlight|hyphenate-(?:character|limit-(?:after|before|lines))|hyphens|initial-letter|justify-content|line-(?:align|box-contain|break|clamp|grid|snap)|locale|logical-(?:height|width)|margin-(?:after(?:-collapse)?|before(?:-collapse)?|bottom-collapse|end|start|top-collapse)|mask(?:-(?:box-(?:image(?:-(?:outset|repeat|slice|source|width))?)|clip|composite|image|origin|position(?:-(?:x|y))?|repeat(?:-(?:x|y))?|size|source-type))?|max-(?:logical-(?:height|width))|min-(?:logical-(?:height|width))|nbsp-mode|opacity|order|padding-(?:after|before|end|start)|perspective(?:-(?:origin(?:-(?:x|y))?))?|print-(?:color-adjust)|rtl-ordering|ruby-position|shape-(?:image-threshold|margin|outside)|tap-(?:highlight-color)|text-(?:combine|decorations-(?:in-effect)|emphasis(?:-(?:color|position|style))?|fill-color|orientation|security|size-adjust|stroke(?:-(?:color|width))?|zoom)|transform(?:-(?:origin(?:-(?:x|y|z))?|style))?|transition(?:-(?:delay|duration|property|timing-function))?|user-(?:drag|modify|select)|writing-mode)|white-space|widows|width|will-change|word-(?:break|spacing|wrap)|writing-mode|x|y|z-index|zoom):(\\S+?)': ({macroMatch, selectorProperties}): void => {
			const propertyName = macroMatch.getCapture(0);
			selectorProperties.add(`${(/^(?:apple|webkit|moz)/).test(propertyName) ? '-' : ''}${propertyName}`, macroMatch.getCapture(1));
		}
	},
	helpers: {
		darken: (color: string, amount: number) => lightenDarkenColor(color, -amount),
		lighten: (color: string, amount: number) => lightenDarkenColor(color, amount),
		colorToRgb: (color: string, alpha: number = null) => {
			const { r, g, b } = parseColor(color);
			const rgb = `${r},${g},${b}`;

			return alpha ? `rgba(${rgb},${alpha})` : `rgb(${rgb})`;
		}
	}
} as Partial<CompilerConfigInterface>;
