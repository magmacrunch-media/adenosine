// engine/renderer.js
// Y-sorted rendering pipeline. Game provides tile renderer and entity renderers.

import { ctx, canvas } from './state.js';
import { camera } from './camera.js';

/**
 * Render the game world with Y-sorted depth ordering.
 *
 * @param {object} opts
 * @param {number[][]} opts.map - 2D tile array
 * @param {number} opts.tileSize - Tile size in pixels
 * @param {Function} opts.renderTile - (ctx, screenX, screenY, tileId, tileX, tileY) => void
 * @param {Array} opts.layers - Array of { sortY, render } objects to sort and draw
 * @param {Function} [opts.background] - (ctx) => void, drawn first (e.g. parallax forest)
 */
export function renderWorld({ map, tileSize, renderTile, layers = [], background } = {}) {
    if (!ctx || !canvas || !map) return;

    // Background (parallax, sky, etc.)
    if (background) background(ctx);

    // Tile rendering
    const sx = Math.floor(camera.x / tileSize);
    const sy = Math.floor(camera.y / tileSize);
    const ex = sx + Math.ceil(canvas.width / tileSize) + 2;
    const ey = sy + Math.ceil(canvas.height / tileSize) + 2;
    const mapWidth = map[0] ? map[0].length : 0;
    const mapHeight = map.length;

    for (let y = Math.max(0, sy); y < Math.min(mapHeight, ey); y++) {
        for (let x = Math.max(0, sx); x < Math.min(mapWidth, ex); x++) {
            const tile = map[y][x];
            const screenX = Math.floor(x * tileSize - camera.x);
            const screenY = Math.floor(y * tileSize - camera.y);
            renderTile(ctx, screenX, screenY, tile, x, y);
        }
    }

    // Sort by Y and draw (copy to avoid mutating caller's array)
    const sorted = [...layers].sort((a, b) => a.sortY - b.sortY);
    for (const layer of sorted) {
        layer.render(ctx);
    }
}

/**
 * Helper: convert tile coords to screen coords.
 */
export function tileToScreen(tileX, tileY, tileSize) {
    return {
        x: Math.floor(tileX * tileSize - camera.x),
        y: Math.floor(tileY * tileSize - camera.y),
    };
}

/**
 * Helper: draw a sprite (stub — game provides actual drawing logic).
 * Sprite registry pattern: map type strings to draw functions.
 */
export function createSpriteRegistry() {
    const registry = {};
    return {
        register: (type, drawFn) => { registry[type] = drawFn; },
        draw: (type, ...args) => {
            if (registry[type]) registry[type](...args);
            else {
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(args[0], args[1], args[2] || 16, args[3] || 16);
            }
        },
    };
}
