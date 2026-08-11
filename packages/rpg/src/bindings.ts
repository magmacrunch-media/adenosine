// engine/bindings.ts
// Default key bindings for input and movement.

import type { KeyBindings } from './types.js';

export const DEFAULT_BINDINGS: KeyBindings = {
    moveUp:    ['arrowup', 'w'],
    moveDown:  ['arrowdown', 's'],
    moveLeft:  ['arrowleft', 'a'],
    moveRight: ['arrowright', 'd'],
    pause:     ['escape', 'p'],
    interact:  [' '],
};
