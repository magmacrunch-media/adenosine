// engine/health.js
// Health system with damage/healing and game-over callback.

import { player } from './state.js';

let onGameOverCallback = null;

export function setOnGameOverCallback(fn) { onGameOverCallback = fn; }

export function damagePlayer(amount) {
    if (amount <= 0) return;
    const wasAlive = player.health > 0;
    player.health = Math.max(0, player.health - amount);
    if (wasAlive && player.health <= 0 && onGameOverCallback) onGameOverCallback();
}

export function healPlayer(amount) {
    if (amount <= 0) return;
    player.health = Math.min(player.maxHealth, player.health + amount);
}
