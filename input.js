// engine/input.js
// Keyboard input handling — tracks held keys and one-shot key presses.

import { DEFAULT_BINDINGS } from './bindings.js';
import { engine } from './events.js';

export const keys = {};
export const keysPressed = {};

export function initInput({ onPause, onInteract, bindings = DEFAULT_BINDINGS } = {}) {
    const pauseKeys = new Set(bindings.pause.map(k => k.toLowerCase()));
    const interactKeys = new Set(bindings.interact.map(k => k.toLowerCase()));

    function onKeyDown(e) {
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

    function onKeyUp(e) {
        const key = e.key.toLowerCase();
        keys[key] = false;
        keysPressed[key] = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return {
        destroy() {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        },
    };
}
