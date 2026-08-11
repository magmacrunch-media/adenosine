// engine/events.ts
// Minimal pub/sub event bus for inter-module communication.

import type { EventBus, EventName, EventMap } from './types.js';

type ListenerFn = (...args: unknown[]) => void;

export function createEventBus(): EventBus {
    const listeners: Partial<Record<EventName, ListenerFn[]>> = {};

    const bus: EventBus = {
        on<K extends EventName>(event: K, fn: EventMap[K] extends void ? () => void : (data: EventMap[K]) => void): () => void {
            if (!listeners[event]) listeners[event] = [];
            const arr = listeners[event]!;
            arr.push(fn as ListenerFn);
            return () => bus.off(event, fn as (...args: unknown[]) => void);
        },
        once<K extends EventName>(event: K, fn: EventMap[K] extends void ? () => void : (data: EventMap[K]) => void): () => void {
            const wrapper = (...args: unknown[]) => { (fn as (...a: unknown[]) => void)(...args); bus.off(event, wrapper); };
            return bus.on(event, wrapper as EventMap[K] extends void ? () => void : (data: EventMap[K]) => void);
        },
        off(event: EventName, fn: (...args: unknown[]) => void): void {
            const arr = listeners[event];
            if (arr) {
                listeners[event] = arr.filter(f => f !== fn) as ListenerFn[];
            }
        },
        emit<K extends EventName>(event: K, ...args: EventMap[K] extends void ? [] : [EventMap[K]]): void {
            for (const fn of (listeners[event] || [])) {
                if (args.length > 0) {
                    fn(args[0]);
                } else {
                    fn();
                }
            }
        },
    };

    return bus;
}

// Singleton bus for the engine
export const engine: EventBus = createEventBus();
