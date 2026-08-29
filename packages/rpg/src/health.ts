// engine/health.ts
// Health system with damage/healing and game-over callback.

import { player } from './state.js';
import { engine } from './events.js';
import type { DamageCooldown } from './types.js';

let onGameOverCallback: (() => void) | null = null;

/** Pass null to clear. A stale callback holds a closure over a dead scene. */
export function setOnGameOverCallback(fn: (() => void) | null): void { onGameOverCallback = fn; }

export function damagePlayer(amount: number): void {
    if (amount <= 0) return;
    const wasAlive = player.health > 0;
    player.health = Math.max(0, player.health - amount);
    engine.emit('health-changed', { health: player.health, maxHealth: player.maxHealth });
    if (wasAlive && player.health <= 0) {
        engine.emit('player-died', { health: player.health });
        if (onGameOverCallback) onGameOverCallback();
    }
}

export function healPlayer(amount: number): void {
    if (amount <= 0) return;
    player.health = Math.min(player.maxHealth, player.health + amount);
    engine.emit('health-changed', { health: player.health, maxHealth: player.maxHealth });
}

export function createDamageCooldown(frames: number = 60): DamageCooldown {
    let cooldown = 0;
    return {
        canDamage() { return cooldown === 0; },
        recordHit() { cooldown = frames; },
        tick() { if (cooldown > 0) cooldown--; },
    };
}
