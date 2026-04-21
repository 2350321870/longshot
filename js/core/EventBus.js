(function() {
    'use strict';

    class EventBus {
        constructor() {
            this.listeners = {};
            this.onceListeners = {};
        }

        on(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
            return this;
        }

        once(event, callback) {
            if (!this.onceListeners[event]) {
                this.onceListeners[event] = [];
            }
            this.onceListeners[event].push(callback);
            return this;
        }

        off(event, callback) {
            if (this.listeners[event]) {
                if (callback) {
                    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
                } else {
                    delete this.listeners[event];
                }
            }
            if (this.onceListeners[event]) {
                if (callback) {
                    this.onceListeners[event] = this.onceListeners[event].filter(cb => cb !== callback);
                } else {
                    delete this.onceListeners[event];
                }
            }
            return this;
        }

        emit(event, ...args) {
            if (this.listeners[event]) {
                for (const callback of this.listeners[event]) {
                    try {
                        callback(...args);
                    } catch (e) {
                        console.error(`EventBus error in listener for ${event}:`, e);
                    }
                }
            }
            
            if (this.onceListeners[event]) {
                const callbacks = [...this.onceListeners[event]];
                delete this.onceListeners[event];
                for (const callback of callbacks) {
                    try {
                        callback(...args);
                    } catch (e) {
                        console.error(`EventBus error in once listener for ${event}:`, e);
                    }
                }
            }
            
            return this;
        }

        hasListeners(event) {
            return !!(this.listeners[event]?.length || this.onceListeners[event]?.length);
        }

        clear() {
            this.listeners = {};
            this.onceListeners = {};
        }
    }

    if (typeof window !== 'undefined') {
        window.EventBus = EventBus;
    }

})();
