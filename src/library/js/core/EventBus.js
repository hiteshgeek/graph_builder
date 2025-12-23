/**
 * EventBus - Central pub/sub system for component communication
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @param {Object} context - Context for callback
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listener = { callback, context };
        this.listeners.get(event).push(listener);

        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const eventListeners = this.listeners.get(event);
        const index = eventListeners.findIndex(l => l.callback === callback);

        if (index > -1) {
            eventListeners.splice(index, 1);
        }

        if (eventListeners.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        if (!this.listeners.has(event)) return;

        const eventListeners = this.listeners.get(event);
        eventListeners.forEach(listener => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        });
    }

    /**
     * Subscribe once to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @param {Object} context - Context for callback
     */
    once(event, callback, context = null) {
        const onceWrapper = (data) => {
            this.off(event, onceWrapper);
            if (context) {
                callback.call(context, data);
            } else {
                callback(data);
            }
        };
        this.on(event, onceWrapper);
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} event - Optional event name
     */
    clear(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

export const eventBus = new EventBus();
export { EventBus };
