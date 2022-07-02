import { HideableElement, HideableElementPropsInterface, PropsInterface } from '.';
import { JSXInternal } from 'preact/src/jsx';
import { preact } from '..';

const { h } = preact;

export const Card = (props: HideableElementPropsInterface): JSXInternal.Element => {
	return (
		<HideableElement visible={props.visible}>
			<div class='profiler__card profiler__card--full-width'>
				{props.children}
			</div>
		</HideableElement>
	);
};

export const CardTitle = (props: PropsInterface): JSXInternal.Element => {
	return <h2 class="profiler__card-title profiler__card-title--large content-visibility:auto">{props.children}</h2>;
};
