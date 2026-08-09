// engine/events.js
// Minimal pub/sub event bus for inter-module communication.

/**
 * Create a new event bus.
 * @returns {{ on: Function, off: Function, emit: Function }}
 */
export function createEventBus() {
    const listeners = {};
    return {
        on(event, fn) {
            (listeners[event] ||= []).push(fn);
            return () => this.off(event, fn);
        },
        off(event, fn) {
            const arr = listeners[event];
            if (arr) listeners[event] = arr.filter(f => f !== fn);
        },
        emit(event, data) {
            for (const fn of (listeners[event] || [])) fn(data);
        },
    };
}

// Singleton bus for the engine
export const engine = createEventBus();
