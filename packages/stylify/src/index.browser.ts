import { Runtime } from '.';

declare global {
	export interface Window {
		Stylify: Runtime;
	}

}

const runtime = new Runtime();

if (typeof window !== 'undefined') {
	window.Stylify = runtime;
}

export default runtime;
