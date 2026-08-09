// engine/health.js
// Health system with damage/healing and game-over callback.

import { player } from './state.js';
import { engine } from './events.js';

let onGameOverCallback = null;

export function setOnGameOverCallback(fn) { onGameOverCallback = fn; }

export function damagePlayer(amount) {
    if (amount <= 0) return;
    const wasAlive = player.health > 0;
    player.health = Math.max(0, player.health - amount);
    engine.emit('health-changed', { health: player.health, maxHealth: player.maxHealth });
    if (wasAlive && player.health <= 0) {
        engine.emit('player-died', { health: player.health });
        if (onGameOverCallback) onGameOverCallback();
    }
}

export function healPlayer(amount) {
    if (amount <= 0) return;
    player.health = Math.min(player.maxHealth, player.health + amount);
    engine.emit('health-changed', { health: player.health, maxHealth: player.maxHealth });
}

/**
 * Create a damage cooldown timer for post-hit invincibility frames.
 * @param {number} frames - Duration of cooldown in frames
 * @returns {{ canDamage: Function, recordHit: Function, tick: Function }}
 */
export function createDamageCooldown(frames = 60) {
    let cooldown = 0;
    return {
        canDamage() { return cooldown === 0; },
        recordHit() { cooldown = frames; },
        tick() { if (cooldown > 0) cooldown--; },
    };
}
