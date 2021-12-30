const { nativePreset } = require('@stylify/stylify');

module.exports = {
	compiler: {
		...nativePreset.compiler,
		...{
			selectorsAreas: [
				'(?:^|\\s+)class=\\{`((?:.|\n)+?)`\\}'
			],
			variables: {
				grey1: '#374955',
				grey2: '#f1f3f5',
				grey3: '#dddddd',

				blue1: '#0072bf',
				blue2: '#ebf6fa',

				blueLogo: 'rgb(16, 184, 240)',
				blueLogoHover: 'rgba(16, 184, 240, 0.8)'
			},
			plainSelectors: {
				'*': 'box-sizing:border-box',
				a: 'color:$blue1 text-decoration:none cursor:pointer hover:text-decoration:underline',
				table: 'border-collapse:collapse width:100%',
				thead: 'position:sticky top:0 background-color:$blue1 color:#fff',
				'td, th': 'text-align:left padding:12px',
				tr: 'content-visibility:auto',
				'tbody tr:nth-child(even)': 'background-color:$grey2',
				pre: `
					margin:0 padding:8px border-radius:4px background-color:$blue2 max-height:400px overflow:auto
					width:100% max-width:100%
					lg:padding:12px
				`,
				'table pre': 'background:none padding:none',
				'main .profiler__card': 'box-shadow:0__4px__16px__-4px__rgba(0,__0,__0,__0.2)',
				'.profiler__card': `
					display:inline-flex flex-direction:row align-items:center flex-direction:row padding:12px
					background-color:#fff border-radius:8px
					box-shadow:0__6px__8px__1px__rgba(0,0,0,0.06)
					lg:padding:24px
				`,
				'.profiler__card--full-width': `
					flex-direction:column align-items:flex-start margin-bottom:12px width:100%
					lg:margin-bottom:24px
				`,
				'.profiler__card-title': 'margin-top:0 margin-bottom:8px font-size:1rem',
				'.profiler__card-title--large': 'margin-bottom:12px font-size:1.5rem md:margin-bottom:24px',
				'.profiler__card-icon': 'border-radius:8px padding:12px margin-right:12px font-size:32px color:#fff',
				'.profiler__tab-title': 'font-size:1,8rem margin-bottom:24px color:$blue1 md:margin-bottom:32px',
				'.profiler__table-wrapper': `
					width:100% max-height:400px overflow:auto  border:1px__solid__$grey2 border-radius:4px
				`
			},
			components: {
				'profiler__tab-button': `
					font-weight:bold display:flex align-items:center padding:12px transition:background-color__0.3s
					white-space:nowrap margin-bottom:8px color:#000 margin-bottom:8px
					border-radius:8px cursor:pointer user-select:none
					hover:background-color:$blue2
				`,
				'profiler__tab-button--selected': {
					selectors: 'background-color:$blue1 color:#fff hover:background-color:$blue1',
					selectorsChain: 'profiler__tab-button'
				},
				'profiler__tab-button-icon': `width:18px height:18px margin-right:12px`,
				'profiler__tab-button-icon--selected': {
					selectors: 'filter:brightness(0)__invert(1)',
					selectorsChain: 'profiler__tab-button-icon'
				}
			}
		}
	}
};
