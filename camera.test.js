import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./state.js', () => ({
    canvas: { width: 320, height: 240 },
}));

import { camera, updateCamera } from './camera.js';

beforeEach(() => {
    camera.x = 0;
    camera.y = 0;
});

describe('updateCamera', () => {
    it('moves camera toward target', () => {
        updateCamera({ target: { x: 10, y: 10 }, tileSize: 16, smoothing: 1.0 });
        expect(camera.x).toBeGreaterThan(0);
        expect(camera.y).toBeGreaterThan(0);
    });

    it('centers on target with smoothing=1.0 (instant snap)', () => {
        updateCamera({ target: { x: 10, y: 10 }, tileSize: 16, smoothing: 1.0 });
        const expectedX = 10 * 16 - 320 / 2 + 16 / 2;
        const expectedY = 10 * 16 - 240 / 2 + 16 / 2;
        expect(camera.x).toBe(expectedX);
        expect(camera.y).toBe(expectedY);
    });

    it('smoothly follows with low smoothing factor', () => {
        updateCamera({ target: { x: 10, y: 10 }, tileSize: 16, smoothing: 0.1 });
        expect(camera.x).toBeGreaterThan(0);
        expect(camera.x).toBeLessThan(10 * 16);
    });

    it('rounds camera position to integers', () => {
        updateCamera({ target: { x: 3, y: 3 }, tileSize: 16, smoothing: 0.3 });
        expect(Number.isInteger(camera.x)).toBe(true);
        expect(Number.isInteger(camera.y)).toBe(true);
    });

    it('converges over multiple updates', () => {
        for (let i = 0; i < 100; i++) {
            updateCamera({ target: { x: 10, y: 10 }, tileSize: 16, smoothing: 0.3 });
        }
        const expectedX = 10 * 16 - 320 / 2 + 16 / 2;
        const expectedY = 10 * 16 - 240 / 2 + 16 / 2;
        expect(camera.x).toBeGreaterThanOrEqual(expectedX - 1);
        expect(camera.x).toBeLessThanOrEqual(expectedX + 1);
        expect(camera.y).toBeGreaterThanOrEqual(expectedY - 1);
        expect(camera.y).toBeLessThanOrEqual(expectedY + 1);
    });
});
