// engine/movement.js
// Tile-based player movement with diagonal normalization and collision checking.

import { keys } from './input.js';
import { isSolid } from './collision.js';

/**
 * Handle player movement based on current key state.
 * Mutates player.x, player.y, player.facingX/Y, player.direction, player.isWalking.
 *
 * @param {object} player
 * @param {object} opts
 * @param {number} opts.speed - Movement speed in tiles per frame
 * @param {Function} opts.isBlocked - Additional blocking check (e.g. dialogue active)
 * @param {object} opts.collisionOpts - Options passed to isSolid (map, solidTiles, entities, props)
 * @returns {boolean} Whether the player moved
 */
export function handleMovement(player, { speed = 0.4, isBlocked, collisionOpts = {} } = {}) {
    const isMovementKey = keys['arrowup'] || keys['w'] || keys['arrowdown'] ||
                          keys['s'] || keys['arrowleft'] || keys['a'] ||
                          keys['arrowright'] || keys['d'];

    player.isWalking = isMovementKey;

    if (isBlocked && isBlocked()) {
        player.isWalking = false;
        return false;
    }

    if (!isMovementKey) return false;

    // Determine direction
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) { dx = -1; player.facingX = -1; player.facingY = 0; player.direction = 'left'; }
    else if (keys['arrowright'] || keys['d']) { dx = 1; player.facingX = 1; player.facingY = 0; player.direction = 'right'; }
    if (keys['arrowup'] || keys['w']) { dy = -1; player.facingX = 0; player.facingY = -1; player.direction = 'up'; }
    else if (keys['arrowdown'] || keys['s']) { dy = 1; player.facingX = 0; player.facingY = 1; player.direction = 'down'; }

    // Diagonal normalization
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Check collision before moving
    const newX = player.x + dx * speed;
    const newY = player.y + dy * speed;

    // Allow movement if at least one axis is free
    if (dx !== 0 && !isSolid(newX, player.y, collisionOpts)) {
        player.x = newX;
    }
    if (dy !== 0 && !isSolid(player.x, newY, collisionOpts)) {
        player.y = newY;
    }

    return true;
}
