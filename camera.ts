// engine/camera.ts
// Smooth-follow camera system with bounds clamping.

import { canvas } from './state.js';
import type { Camera, UpdateCameraOpts } from './types.js';

export const camera: Camera = { x: 0, y: 0 };

export function updateCamera({ target, tileSize, mapWidth, mapHeight, smoothing = 0.3 }: UpdateCameraOpts = {} as UpdateCameraOpts): void {
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
