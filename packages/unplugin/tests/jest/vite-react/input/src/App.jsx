/*
stylify-variables
titleFontSize: '42px',
containerWidth: '800px'
/stylify-variables

stylify-components
container: 'max-width:$containerWidth margin:0__auto background:red',
title: 'text-align:right margin-top:100px font-size:$titleFontSize color:blue'
/stylify-components
*/

import Button from './Button';

export default function App() {
	return (
		<div className="container">
			<div className="title">Hello World! 🎉</div>
			<Button>asdasd</Button>
		</div>
	);
}
