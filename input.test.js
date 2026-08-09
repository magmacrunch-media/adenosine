/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keys, keysPressed, initInput, _resetInputState } from './input.js';

describe('initInput', () => {
    let onPause, onInteract;
    const addedListeners = [];

    beforeEach(() => {
        _resetInputState();
        for (const key of Object.keys(keys)) delete keys[key];
        for (const key of Object.keys(keysPressed)) delete keysPressed[key];
        onPause = vi.fn();
        onInteract = vi.fn();
        addedListeners.length = 0;
    });

    afterEach(() => {
        for (const { type, fn } of addedListeners) {
            window.removeEventListener(type, fn);
        }
    });

    function registerCallbacks(opts) {
        const spy = vi.spyOn(window, 'addEventListener');
        initInput(opts);
        const calls = spy.mock.calls.filter(([type]) => type === 'keydown' || type === 'keyup');
        for (const [type, fn] of calls) {
            addedListeners.push({ type, fn });
        }
        spy.mockRestore();
    }

    it('registers keydown and keyup listeners on window', () => {
        const spy = vi.spyOn(window, 'addEventListener');
        initInput();
        expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(spy).toHaveBeenCalledWith('keyup', expect.any(Function));
        const calls = spy.mock.calls.filter(([type]) => type === 'keydown' || type === 'keyup');
        for (const [type, fn] of calls) {
            addedListeners.push({ type, fn });
        }
        spy.mockRestore();
    });

    it('tracks held keys on keydown', () => {
        registerCallbacks();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
        expect(keys['w']).toBe(true);
    });

    it('clears held keys on keyup', () => {
        registerCallbacks();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
        expect(keys['w']).toBe(true);
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
        expect(keys['w']).toBe(false);
    });

    it('tracks one-shot key presses', () => {
        registerCallbacks();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        expect(keysPressed['a']).toBe(true);
    });

    it('clears one-shot on keyup', () => {
        registerCallbacks();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
        expect(keysPressed['a']).toBe(false);
    });

    it('does not re-trigger keysPressed on held key', () => {
        registerCallbacks();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        expect(keysPressed['a']).toBe(true);
    });

    it('calls onPause on Escape key', () => {
        registerCallbacks({ onPause });
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onPause).toHaveBeenCalledOnce();
    });

    it('calls onPause on p key', () => {
        registerCallbacks({ onPause });
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
        expect(onPause).toHaveBeenCalledOnce();
    });

    it('calls onInteract when space key is pressed', () => {
        registerCallbacks({ onInteract });
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        expect(keys[' ']).toBe(true);
        expect(onInteract).toHaveBeenCalledOnce();
    });

    it('normalizes key to lowercase', () => {
        registerCallbacks();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }));
        expect(keys['w']).toBe(true);
    });

    describe('destroy', () => {
        it('returns object with destroy method', () => {
            const spy = vi.spyOn(window, 'addEventListener');
            initInput();
            const calls = spy.mock.calls.filter(([type]) => type === 'keydown' || type === 'keyup');
            for (const [type, fn] of calls) {
                addedListeners.push({ type, fn });
            }
            spy.mockRestore();
        });

        it('destroy removes event listeners', () => {
            const handle = initInput();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
            expect(keys['z']).toBe(true);

            handle.destroy();
            keys['z'] = false;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
            expect(keys['z']).toBe(false);
        });
    });
});
