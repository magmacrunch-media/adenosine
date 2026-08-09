// engine/detection.js
// Entity and prop detection helpers for interaction systems.

/**
 * Find the first entity on the tile the player is facing.
 * @param {object} player - Player object with x, y, facingX, facingY
 * @param {Array} entities - Array of entities to check
 * @param {object} [opts]
 * @param {string} [opts.map] - Filter entities by map name
 * @param {number} [opts.threshold=0.8] - Squared distance threshold
 * @param {Function} [opts.filter] - Additional filter function
 * @returns {object|null} First matching entity or null
 */
export function getEntityInFront(player, entities, opts = {}) {
    const { map, threshold = 0.8, filter } = opts;
    const targetX = player.x + player.facingX;
    const targetY = player.y + player.facingY;

    for (const entity of entities) {
        if (map && entity.map !== map) continue;
        if (filter && !filter(entity)) continue;

        const dx = entity.x - targetX;
        const dy = entity.y - targetY;
        if ((dx * dx + dy * dy) < threshold) {
            return entity;
        }
    }
    return null;
}

/**
 * Check if the player is facing a prop (supports multi-tile props).
 * @param {object} player - Player object with x, y, facingX, facingY
 * @param {object} prop - Prop with x, y, and optional width, height
 * @returns {boolean}
 */
export function isFacingProp(player, prop) {
    const facingX = Math.floor(player.x + player.facingX);
    const facingY = Math.floor(player.y + player.facingY);

    if (prop.width && prop.height) {
        for (let dy = 0; dy < prop.height; dy++) {
            for (let dx = 0; dx < prop.width; dx++) {
                if (facingX === prop.x + dx && facingY === prop.y + dy) {
                    return true;
                }
            }
        }
        return false;
    }

    return facingX === prop.x && facingY === prop.y;
}

/**
 * Check if the player is near a prop (Manhattan distance).
 * @param {object} player - Player object with x, y
 * @param {object} prop - Prop with x, y, and optional width, height
 * @param {number} [threshold=2.0] - Maximum Manhattan distance
 * @returns {boolean}
 */
export function isNearProp(player, prop, threshold = 2.0) {
    if (prop.width && prop.height) {
        for (let dy = 0; dy < prop.height; dy++) {
            for (let dx = 0; dx < prop.width; dx++) {
                const distance = Math.abs(player.x - (prop.x + dx)) + Math.abs(player.y - (prop.y + dy));
                if (distance < threshold) return true;
            }
        }
        return false;
    }

    const distance = Math.abs(player.x - prop.x) + Math.abs(player.y - prop.y);
    return distance < threshold;
}
