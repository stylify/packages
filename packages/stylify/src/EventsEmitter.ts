// @ts-nocheck

class EventsEmitter {

	private eventListeners: Record<string, Record<string, any>[]> = {};

	dispatch(eventName: string, eventData: Record<string, any> = null): EventsEmitter {
		if (!(eventName in this.eventListeners)) {
			return;
		}
		this.eventListeners[eventName].forEach(element => {
			//je to objekt co má id a callbakc func nevím jak to napsat
			element.callback(eventData);
		});

		return this;
	}

	addListener = (event: string, callback: CallableFunction, id: string = null): EventsEmitter => {
		if (!(event in this.eventListeners)) {
			this.eventListeners[event] = [];
		}

		const idExists = this.eventListeners[event].findIndex((item) => item.id === id);

		if (idExists > -1) {
			return;
		}

		this.eventListeners[event].push({callback: callback, id: id});

		return this;
	}

}

export default new EventsEmitter();
