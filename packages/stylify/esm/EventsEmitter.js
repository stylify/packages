/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

class EventsEmitter {
  constructor() {
    this.eventListeners = {};

    this.addListener = (event, callback, id = null) => {
      if (!(event in this.eventListeners)) {
        this.eventListeners[event] = [];
      }

      const idExists = this.eventListeners[event].findIndex(item => item.id === id);

      if (idExists > -1) {
        return;
      }

      this.eventListeners[event].push({
        callback: callback,
        id: id
      });
      return this;
    };
  }

  dispatch(eventName, eventData = null) {
    if (!(eventName in this.eventListeners)) {
      return;
    }

    this.eventListeners[eventName].forEach(element => {
      element.callback(eventData);
    });
    return this;
  }

}

var EventsEmitter$1 = new EventsEmitter();

export default EventsEmitter$1;
