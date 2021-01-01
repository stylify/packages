export default class Debugger {

}

if (typeof window !== 'undefined') {
	document.addEventListener('stylify:beforeInit', () => {
		(<any>window).Stylify.debugger = new Debugger();
	});
}
