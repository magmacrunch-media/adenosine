// engine/input.ts
// Keyboard input handling — tracks held keys and one-shot key presses.

import { DEFAULT_BINDINGS } from './bindings.js';
import { engine } from './events.js';
import type { KeyBindings, InputListener, InitInputOpts } from './types.js';

export const keys: Record<string, boolean> = {};
export const keysPressed: Record<string, boolean> = {};

let activeListeners: InputListener | null = null;

export function _resetInputState(): void {
    if (activeListeners) {
        activeListeners.destroy();
    }
    activeListeners = null;
}

export function initInput({ onPause, onInteract, bindings = DEFAULT_BINDINGS }: InitInputOpts = {}): InputListener {
    if (activeListeners) return activeListeners;

    const pauseKeys = new Set(bindings.pause.map(k => k.toLowerCase()));
    const interactKeys = new Set(bindings.interact.map(k => k.toLowerCase()));

    function onKeyDown(e: KeyboardEvent): void {
        const key = e.key.toLowerCase();

        if (pauseKeys.has(key)) {
            engine.emit('pause-toggle');
            if (onPause) onPause();
            return;
        }

        if (!keysPressed[key]) {
            keysPressed[key] = true;
            if (interactKeys.has(key)) {
                e.preventDefault();
                engine.emit('interact');
                if (onInteract) onInteract();
            }
        }

        keys[key] = true;
    }

    function onKeyUp(e: KeyboardEvent): void {
        const key = e.key.toLowerCase();
        keys[key] = false;
        keysPressed[key] = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    activeListeners = {
        destroy() {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            activeListeners = null;
        },
    };

    return activeListeners;
}
