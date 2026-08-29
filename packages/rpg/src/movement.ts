// engine/movement.ts
// Tile-based player movement with diagonal normalization and collision checking.

import { keys } from './input.js';
import { isSolid } from './collision.js';
import { DEFAULT_BINDINGS } from './bindings.js';
import type { Player, HandleMovementOpts } from './types.js';

export function handleMovement(player: Player, { speed = 0.4, dt = 1, isBlocked, collisionOpts = {}, bindings = DEFAULT_BINDINGS }: HandleMovementOpts = {}): boolean {
    if (speed <= 0) return false;

    const upKeys = bindings.moveUp.map(k => k.toLowerCase());
    const downKeys = bindings.moveDown.map(k => k.toLowerCase());
    const leftKeys = bindings.moveLeft.map(k => k.toLowerCase());
    const rightKeys = bindings.moveRight.map(k => k.toLowerCase());

    const isUp = upKeys.some(k => keys[k]);
    const isDown = downKeys.some(k => keys[k]);
    const isLeft = leftKeys.some(k => keys[k]);
    const isRight = rightKeys.some(k => keys[k]);
    const isMovementKey = isUp || isDown || isLeft || isRight;

    player.isWalking = isMovementKey;

    if (isBlocked && isBlocked()) {
        player.isWalking = false;
        return false;
    }

    if (!isMovementKey) return false;

    // Determine direction
    let dx = 0, dy = 0;
    if (isLeft) { dx = -1; player.facingX = -1; player.facingY = 0; player.direction = 'left'; }
    else if (isRight) { dx = 1; player.facingX = 1; player.facingY = 0; player.direction = 'right'; }
    if (isUp) { dy = -1; player.facingX = 0; player.facingY = -1; player.direction = 'up'; }
    else if (isDown) { dy = 1; player.facingX = 0; player.facingY = 1; player.direction = 'down'; }

    // Diagonal normalization
    if (dx !== 0 && dy !== 0) {
        dx *= 1 / Math.SQRT2;
        dy *= 1 / Math.SQRT2;
    }

    // Check collision before moving
    const newX = player.x + dx * speed * dt;
    const newY = player.y + dy * speed * dt;

    // Allow movement if at least one axis is free
    if (dx !== 0 && !isSolid(newX, player.y, collisionOpts)) {
        player.x = newX;
    }
    if (dy !== 0 && !isSolid(player.x, newY, collisionOpts)) {
        player.y = newY;
    }

    return true;
}
