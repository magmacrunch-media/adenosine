// engine/input.js
// Keyboard input handling — tracks held keys and one-shot key presses.

export const keys = {};
export const keysPressed = {};

export function initInput({ onPause, onInteract } = {}) {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        // Pause toggle
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (onPause) onPause();
            return;
        }

        if (!keysPressed[key]) {
            keysPressed[key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (onInteract) onInteract();
            }
        }

        keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = false;
        keysPressed[key] = false;
    });
}
