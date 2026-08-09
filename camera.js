// engine/camera.js
// Smooth-follow camera system with bounds clamping.

import { canvas } from './state.js';

export const camera = { x: 0, y: 0 };

/**
 * Update camera position to follow a target with smooth interpolation.
 * @param {object} opts
 * @param {object} opts.target - Target to follow { x, y }
 * @param {number} opts.tileSize - Tile size in pixels
 * @param {number} opts.mapWidth - Map width in tiles
 * @param {number} opts.mapHeight - Map height in tiles
 * @param {number} [opts.smoothing=0.3] - Interpolation factor (0-1)
 */
export function updateCamera({ target, tileSize, mapWidth, mapHeight, smoothing = 0.3 } = {}) {
    if (!canvas) return;

    const targetX = target.x * tileSize - canvas.width / 2 + tileSize / 2;
    const targetY = target.y * tileSize - canvas.height / 2 + tileSize / 2;

    camera.x += (targetX - camera.x) * smoothing;
    camera.y += (targetY - camera.y) * smoothing;

    // Clamp to map bounds
    const maxX = Math.max(0, mapWidth * tileSize - canvas.width);
    const maxY = Math.max(0, mapHeight * tileSize - canvas.height);
    camera.x = Math.round(Math.max(0, Math.min(maxX, camera.x)));
    camera.y = Math.round(Math.max(0, Math.min(maxY, camera.y)));
}
