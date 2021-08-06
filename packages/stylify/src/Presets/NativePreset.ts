const minWidthScreen = (screen) => `(min-width: ${screen.replace("minw", "")})`;
const maxWidthScreen = (screen) => `(max-width: ${screen.replace("maxw", "")})`;
const minHeightScreen = (screen) =>
  `(min-height: ${screen.replace("minh", "")})`;
const maxHeightScreen = (screen) =>
  `(max-height: ${screen.replace("maxh", "")})`;
const orientationScreen = (screen) => `(orientation: ${screen})`;

const nativePreset = {
  compiler: {
    screens: {
      toxs: maxWidthScreen("319px"),
      xs: minWidthScreen("320px"),
      tosm: maxWidthScreen("639px"),
      sm: minWidthScreen("640px"),
      tomd: maxWidthScreen("767px"),
      md: minWidthScreen("768px"),
      tolg: maxWidthScreen("1023px"),
      lg: minWidthScreen("1024px"),
      toxl: maxWidthScreen("1279px"),
      xl: minWidthScreen("1280px"),
      to2xl: maxWidthScreen("1535px"),
      "2xl": minWidthScreen("1536px"),
      to3xl: maxWidthScreen("1919px"),
      "3xl": minWidthScreen("1920px"),
      "minw\\w+": minWidthScreen,
      "maxw\\w+": maxWidthScreen,
      "minh\\w+": minHeightScreen,
      "maxh\\w+": maxHeightScreen,
      screen: "screen",
      portrait: orientationScreen("portrait"),
      landscape: orientationScreen("landscape"),
      dark: "(prefers-color-scheme: dark)",
    },
    macros: {
      "(-(?:apple-(?:color-filter|pay-(?:button-(?:style|type))|trailing-word)|moz-(?:appearance|box-(?:align|direction|flex|ordinal-group|orient|pack)|float-edge|force-(?:broken-(?:image-icon))|image-region|orient|outline-(?:radius-(?:bottomleft|bottomright|topleft|topright))|stack-sizing|tab-size|text-(?:size-adjust)|user-(?:focus|input|modify|select)|window-dragging)|webkit-(?:app-region|appearance|aspect-ratio|backdrop-filter|backface-visibility|background-(?:clip|composite|origin|size)|border-(?:fit|horizontal-spacing|image|vertical-spacing)|box-(?:align|decoration-break|direction|flex(?:-group)?|lines|ordinal-group|orient|pack|reflect|shadow)|column-(?:axis|break-(?:after|before|inside)|progression)|cursor-visibility|font-(?:kerning|smoothing)|highlight|hyphenate-(?:character|limit-(?:after|before|lines))|hyphens|initial-letter|line-(?:align|box-contain|clamp|grid|snap)|locale|margin-(?:after-collapse|before-collapse|bottom-collapse|top-collapse)|mask-(?:box-(?:image(?:-(?:outset|repeat|slice|source|width))?)|clip|composite|image|origin|position-(?:x|y)|repeat-(?:x|y)|size|source-type)|nbsp-mode|perspective-(?:origin-(?:x|y))|print-(?:color-adjust)|rtl-ordering|ruby-position|tap-(?:highlight-color)|text-(?:combine|decorations-(?:in-effect)|emphasis-(?:color|position|style)|fill-color|orientation|security|size-adjust|stroke-(?:color|width)|zoom)|transform-(?:origin-(?:x|y|z)|style)|user-(?:drag|modify|select)))|align-(?:content|items|self)|alignment-baseline|all|alt|animation-(?:delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)|appearance|aspect-ratio|backdrop-filter|backface-visibility|background(?:-(?:attachment|blend-mode|clip|color|image|origin|position(?:-(?:x|y))?|repeat(?:-(?:x|y))?|size))?|baseline-shift|block-size|border(?:-(?:block-(?:end-(?:color|style|width)|start-(?:color|style|width))|bottom(?:-(?:color|left-radius|right-radius|style|width))?|collapse|end-(?:end-radius|start-radius)|image-(?:outset|repeat|slice|source|width)|inline-(?:end-(?:color|style|width)|start-(?:color|style|width))|left(?:-(?:color|style|width))?|radius|right(?:-(?:color|style|width))?|spacing|start-(?:end-radius|start-radius)|top(?:-(?:color|left-radius|right-radius|style|width))?))?|bottom|box-(?:decoration-break|shadow|sizing)|break-(?:after|before|inside)|buffered-rendering|caption-side|caret-color|clear|clip(?:-(?:path|rule))?|color(?:-(?:adjust|interpolation(?:-filters)?|rendering|scheme))?|column-(?:count|fill|gap|rule-(?:color|style|width)|span|width)|contain(?:-(?:intrinsic-size))?|content(?:-visibility)?|counter-(?:increment|reset|set)|cursor|cx|cy|d|direction|display|dominant-baseline|empty-cells|fill(?:-(?:opacity|rule))?|filter|flex(?:-(?:basis|direction|grow|shrink|wrap))?|float|flood-(?:color|opacity)|font(?:-(?:family|feature-settings|kerning|language-override|optical-sizing|size(?:-adjust)?|stretch|style|synthesis|variant(?:-(?:alternates|caps|east-asian|ligatures|numeric|position))?|variation-settings|weight))?|forced-(?:color-adjust)|glyph-(?:orientation-(?:horizontal|vertical))|grid-(?:auto-(?:columns|flow|rows)|column-(?:end|start)|row-(?:end|start)|template-(?:areas|columns|rows))|hanging-punctuation|height|hyphens|image-(?:orientation|rendering)|ime-mode|inline-size|inset-(?:block-(?:end|start)|inline-(?:end|start))|isolation|justify-(?:content|items|self)|kerning|left|letter-spacing|lighting-color|line-(?:break|height(?:-step)?)|list-(?:style(?:-(?:image|position|type))?)|margin(?:-(?:block-(?:end|start)|bottom|inline-(?:end|start)|left|right|top))?|marker-(?:end|mid|start)|mask(?:-(?:clip|composite|image|mode|origin|position(?:-(?:x|y))?|repeat|size|type))?|math-(?:depth|shift|style)|max-(?:block-size|height|inline-size|width)|min-(?:block-size|height|inline-size|width)|mix-(?:blend-mode)|object-(?:fit|position)|offset-(?:anchor|distance|path|position|rotate)|opacity|order|orphans|outline-(?:color|offset|style|width)|overflow(?:-(?:anchor|wrap|x|y))?|overscroll-(?:behavior-(?:block|inline|x|y))|padding(?:-(?:block-(?:end|start)|bottom|inline-(?:end|start)|left|right|top))?|page(?:-(?:break-(?:after|before|inside)|orientation))?|paint-order|perspective(?:-(?:origin(?:-(?:x|y))?))?|pointer-events|position|quotes|r|resize|right|rotate|row-gap|ruby-(?:align|position)|rx|ry|scale|scroll-(?:behavior|margin-(?:block-(?:end|start)|bottom|inline-(?:end|start)|left|right|top)|padding-(?:block-(?:end|start)|bottom|inline-(?:end|start)|left|right|top)|snap-(?:align|margin-(?:bottom|left|right|top)|stop|type))|scrollbar-(?:color|width)|shape-(?:image-threshold|margin|outside|rendering)|size|speak(?:-as)?|stop-(?:color|opacity)|stroke(?:-(?:color|dasharray|dashoffset|linecap|linejoin|miterlimit|opacity|width))?|tab-size|table-layout|text-(?:align(?:-last)?|anchor|combine-upright|decoration(?:-(?:color|line|skip(?:-ink)?|style|thickness))?|emphasis-(?:color|position|style)|indent|justify|orientation|overflow|rendering|shadow|size-adjust|transform|underline-(?:offset|position))|top|touch-action|transform(?:-(?:box|origin(?:-(?:x|y|z))?|style))?|transition-(?:delay|duration|property|timing-function)|translate|unicode-bidi|user-select|vector-effect|vertical-align|visibility|white-space|widows|width|will-change|word-(?:break|spacing|wrap)|writing-mode|x|y|z-index|zoom)\\b:(\\S+)": (
        m,
        p
      ) => {
        return p.add(m.getCapture(0), m.getCapture(1));
      },
    },
  },
};

export { nativePreset };
