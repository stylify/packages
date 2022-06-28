import { HideableElementPropsInterface } from '.';
import { JSXInternal } from 'preact/src/jsx';
import { preact } from '..';

const { h } = preact;

export const HideableElement = (props: HideableElementPropsInterface): JSXInternal.Element => {
	return (
		<div class={`${typeof props.visible !== 'boolean' || props.visible ? props.visibleClasses || '' : 'display:none'}`}>
			{props.children}
		</div>
	);
};
