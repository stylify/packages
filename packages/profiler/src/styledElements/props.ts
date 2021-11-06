import { JSXInternal } from 'preact/src/jsx';

export interface PropsInterface {
	children?: JSXInternal.Element[] | JSXInternal.Element
}

export interface HideableElementPropsInterface extends Partial<PropsInterface> {
	visible?: boolean
	visibleClasses?: string
}
