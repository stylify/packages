import { HideableElement, HideableElementPropsInterface, PropsInterface } from '.';
import { JSXInternal } from 'preact/src/jsx';
import { preact } from '..';

const { h } = preact;

export const InlineCard = (props: HideableElementPropsInterface): JSXInternal.Element => {
	return (
		<HideableElement visible={props.visible}>
			<div class='margin-left:12px min-height:124px margin-bottom:12px profiler__card content-visibility:auto'>
				{props.children}
			</div>
		</HideableElement>
	);
};

export const InlineCardTitle = (props: PropsInterface): JSXInternal.Element => {
	return <h2 class="profiler__card-title">{props.children}</h2>;
};

export interface InlineCardIconPropsInterface extends PropsInterface {
	icon: string,
	color: string
}

export const InlineCardIcon = (props: InlineCardIconPropsInterface): JSXInternal.Element => {
	return <i
		class={`profiler__card-icon sp-icon sp-icon-${props.icon}`}
		/* stylify-ignore */
		style={`background-color:${props.color}`}
		/* /stylify-ignore */
	></i>;
};

export const InlineCardButtonsWrapper = (props: PropsInterface): JSXInternal.Element => {
	return <div class="margin-top:12px">{props.children}</div>;
};

export const InlineCardsWrapper = (props: PropsInterface): JSXInternal.Element => {
	return (
		<div class="margin-left:-12px margin-bottom:12px display:flex flex-direction:row flex-wrap:wrap">
			{props.children}
		</div>
	);
};
