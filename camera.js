// engine/camera.js
// Smooth-follow camera system.

import { canvas } from './state.js';

export const camera = { x: 0, y: 0 };

export function updateCamera(target, tileSize, smoothing = 0.3) {
    const targetX = target.x * tileSize - canvas.width / 2 + tileSize / 2;
    const targetY = target.y * tileSize - canvas.height / 2 + tileSize / 2;

    camera.x += (targetX - camera.x) * smoothing;
    camera.y += (targetY - camera.y) * smoothing;

    camera.x = Math.round(camera.x);
    camera.y = Math.round(camera.y);
}
