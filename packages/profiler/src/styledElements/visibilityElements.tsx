import { HideableElementPropsInterface } from '.';
import { JSXInternal } from 'preact/src/jsx';

export const HideableElement = (props: HideableElementPropsInterface): JSXInternal.Element => {
	return (
		<div class={`${typeof props.visible !== 'boolean' || props.visible ? props.visibleClasses || '' : 'display:none'}`}>
			{props.children}
		</div>
	);
};
