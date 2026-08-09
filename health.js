// engine/health.js
// Health system with damage/healing and game-over callback.

import { player } from './state.js';

let onGameOverCallback = null;

export function setOnGameOverCallback(fn) { onGameOverCallback = fn; }

export function damagePlayer(amount) {
    player.health = Math.max(0, player.health - amount);
    if (player.health <= 0 && onGameOverCallback) onGameOverCallback();
}

export function healPlayer(amount) {
    player.health = Math.min(player.maxHealth, player.health + amount);
}
