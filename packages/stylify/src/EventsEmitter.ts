class EventsEmitter {

	dispatch(eventName, eventData: Record<string, any> = null): EventsEmitter {
		let event;

		if (window.CustomEvent && typeof window.CustomEvent === 'function') {
			event = new CustomEvent(eventName, eventData ? {detail: eventData} : null);

		} else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent(eventName, true, true, eventData || {});
		}

		document.dispatchEvent(event);
		return this;
	};

	addListener(event, callback: CallableFunction): EventsEmitter {
		document.addEventListener(event, eventData => callback(eventData));
		return this;
	}

}

export default new EventsEmitter();
