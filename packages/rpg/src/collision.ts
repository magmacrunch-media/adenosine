// engine/collision.ts
// Tile-based + entity collision detection.
// Game provides: solidTiles, getEntitiesForMap, getPropsForMap

import type { CollisionOptions } from './types.js';

export function isSolid(x: number, y: number, { map, solidTiles = [], entities = [], props = [] }: CollisionOptions = {}): boolean {
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
    const tileId = map[checkY]?.[checkX];
    return tileId !== undefined && solidTiles.includes(tileId);
}
