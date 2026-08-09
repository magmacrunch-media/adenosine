import { describe, it, expect, vi } from 'vitest';
import { createEventBus, engine } from './events.js';

describe('createEventBus', () => {
    it('creates a bus with on, off, emit methods', () => {
        const bus = createEventBus();
        expect(typeof bus.on).toBe('function');
        expect(typeof bus.off).toBe('function');
        expect(typeof bus.emit).toBe('function');
    });

    describe('on', () => {
        it('registers a listener', () => {
            const bus = createEventBus();
            const fn = vi.fn();
            bus.on('test', fn);
            bus.emit('test');
            expect(fn).toHaveBeenCalledOnce();
        });

        it('returns an unsubscribe function', () => {
            const bus = createEventBus();
            const fn = vi.fn();
            const unsub = bus.on('test', fn);
            unsub();
            bus.emit('test');
            expect(fn).not.toHaveBeenCalled();
        });

        it('supports multiple listeners for same event', () => {
            const bus = createEventBus();
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            bus.on('test', fn1);
            bus.on('test', fn2);
            bus.emit('test');
            expect(fn1).toHaveBeenCalledOnce();
            expect(fn2).toHaveBeenCalledOnce();
        });

        it('passes data to listener', () => {
            const bus = createEventBus();
            const fn = vi.fn();
            bus.on('test', fn);
            bus.emit('test', { value: 42 });
            expect(fn).toHaveBeenCalledWith({ value: 42 });
        });
    });

    describe('off', () => {
        it('removes a specific listener', () => {
            const bus = createEventBus();
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            bus.on('test', fn1);
            bus.on('test', fn2);
            bus.off('test', fn1);
            bus.emit('test');
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).toHaveBeenCalledOnce();
        });

        it('does nothing for unregistered listener', () => {
            const bus = createEventBus();
            const fn = vi.fn();
            bus.off('test', fn);
            bus.emit('test');
            expect(fn).not.toHaveBeenCalled();
        });

        it('does nothing for unregistered event', () => {
            const bus = createEventBus();
            expect(() => bus.off('nonexistent', vi.fn())).not.toThrow();
        });
    });

    describe('emit', () => {
        it('does nothing when no listeners', () => {
            const bus = createEventBus();
            expect(() => bus.emit('nonexistent')).not.toThrow();
        });

        it('does nothing when no listeners for that event', () => {
            const bus = createEventBus();
            bus.on('other', vi.fn());
            expect(() => bus.emit('nonexistent')).not.toThrow();
        });
    });
});

describe('engine singleton', () => {
    it('is a working event bus', () => {
        const fn = vi.fn();
        const unsub = engine.on('test-singleton', fn);
        engine.emit('test-singleton', 'hello');
        expect(fn).toHaveBeenCalledWith('hello');
        unsub();
        engine.emit('test-singleton', 'gone');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
