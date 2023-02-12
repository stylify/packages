import { Children } from 'react';

export default function Button({ children }) {
	return (
		<button
			className={`
				background:red
			`}
		>
			{children}
		</button>
	);
}
