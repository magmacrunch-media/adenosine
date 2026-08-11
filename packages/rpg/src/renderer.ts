// engine/renderer.ts
// Y-sorted rendering pipeline. Game provides tile renderer and entity renderers.

import { ctx, canvas } from './state.js';
import { camera } from './camera.js';
import type { RenderWorldOpts, SpriteRegistry } from './types.js';

export function renderWorld({ map, tileSize, renderTile, layers = [], background }: RenderWorldOpts): void {
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
            const tile = map[y]![x]!;
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

export function tileToScreen(tileX: number, tileY: number, tileSize: number): { x: number; y: number } {
    return {
        x: Math.floor(tileX * tileSize - camera.x),
        y: Math.floor(tileY * tileSize - camera.y),
    };
}

export function createSpriteRegistry(): SpriteRegistry {
    const registry: Record<string, (...args: unknown[]) => void> = {};
    return {
        register: (type: string, drawFn: (...args: unknown[]) => void) => { registry[type] = drawFn; },
        draw: (type: string, ...args: unknown[]) => {
            if (registry[type]) registry[type](...args);
            else if (ctx) {
                ctx.fillStyle = '#ff00ff';
                const [x, y, w, h] = args;
                if (typeof x === 'number' && typeof y === 'number') {
                    ctx.fillRect(x, y, typeof w === 'number' ? w : 16, typeof h === 'number' ? h : 16);
                }
            }
        },
    };
}
