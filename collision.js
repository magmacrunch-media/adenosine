// engine/collision.js
// Tile-based + entity collision detection.
// Game provides: solidTiles, getEntitiesForMap, getPropsForMap

/**
 * Check if a tile position is solid.
 * @param {number} x - Tile X (can be fractional)
 * @param {number} y - Tile Y (can be fractional)
 * @param {object} opts
 * @param {number[][]} opts.map - 2D tile array
 * @param {number[]} opts.solidTiles - Array of solid tile IDs
 * @param {Array} opts.entities - Entities to check (NPCs, enemies)
 * @param {Array} opts.props - Solid prop positions [{x, y}]
 * @returns {boolean}
 */
export function isSolid(x, y, { map, solidTiles = [], entities = [], props = [] } = {}) {
    if (!map || !map.length) return true;
    const checkX = Math.floor(x + 0.001);
    const checkY = Math.floor(y + 0.001);

    const mapHeight = map.length;
    const mapWidth = map[0] ? map[0].length : 0;

    // Boundary check
    const bottomBoundary = mapHeight - 1;
    if (checkX < 1 || checkX >= mapWidth - 1 || checkY < 1 || checkY >= bottomBoundary) {
        return true;
    }

    // Guard against ragged map rows
    if (!map[checkY] || checkX >= map[checkY].length) return true;

    // Entity collision (distance-based)
    for (const entity of entities) {
        const eWidth = entity.width || 1;
        const eHeight = entity.height || 1;
        const eCenterX = entity.x + eWidth / 2;
        const eCenterY = entity.y + eHeight / 2;
        const pCenterX = x + 0.5;
        const pCenterY = y + 0.5;
        const dx = Math.abs(pCenterX - eCenterX);
        const dy = Math.abs(pCenterY - eCenterY);
        const radius = Math.max(eWidth, eHeight) * 0.6;

        if (dx < radius && dy < radius) {
            return true;
        }
    }

    // Prop collision (exact tile match)
    for (const prop of props) {
        if (checkX === prop.x && checkY === prop.y) {
            return true;
        }
    }

    // Tile collision
    return solidTiles.includes(map[checkY][checkX]);
}
