import { HideableElement, HideableElementPropsInterface } from '.';
import { JSXInternal } from 'preact/src/jsx';
import { preact } from '..';

const { h } = preact;

export const TableWrapper = (props: HideableElementPropsInterface): JSXInternal.Element => {
	return (
		<HideableElement visible={props.visible} visibleClasses='width:100%'>
			<div class="profiler__table-wrapper">
				{props.children}
			</div>
		</HideableElement>
	);
};
