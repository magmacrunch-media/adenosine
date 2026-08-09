import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./state.js', () => ({
    canvas: { width: 320, height: 240 },
}));

import { camera, updateCamera } from './camera.js';

beforeEach(() => {
    camera.x = 0;
    camera.y = 0;
});

const defaultOpts = { tileSize: 16, mapWidth: 100, mapHeight: 100 };

describe('updateCamera', () => {
    it('moves camera toward target', () => {
        updateCamera({ target: { x: 10, y: 10 }, ...defaultOpts, smoothing: 1.0 });
        expect(camera.x).toBeGreaterThan(0);
        expect(camera.y).toBeGreaterThan(0);
    });

    it('centers on target with smoothing=1.0 (instant snap)', () => {
        updateCamera({ target: { x: 10, y: 10 }, ...defaultOpts, smoothing: 1.0 });
        const expectedX = 10 * 16 - 320 / 2 + 16 / 2;
        const expectedY = 10 * 16 - 240 / 2 + 16 / 2;
        expect(camera.x).toBe(expectedX);
        expect(camera.y).toBe(expectedY);
    });

    it('smoothly follows with low smoothing factor', () => {
        updateCamera({ target: { x: 10, y: 10 }, ...defaultOpts, smoothing: 0.1 });
        expect(camera.x).toBeGreaterThan(0);
        expect(camera.x).toBeLessThan(10 * 16);
    });

    it('rounds camera position to integers', () => {
        updateCamera({ target: { x: 3, y: 3 }, ...defaultOpts, smoothing: 0.3 });
        expect(Number.isInteger(camera.x)).toBe(true);
        expect(Number.isInteger(camera.y)).toBe(true);
    });

    it('converges over multiple updates', () => {
        for (let i = 0; i < 100; i++) {
            updateCamera({ target: { x: 10, y: 10 }, ...defaultOpts, smoothing: 0.3 });
        }
        const expectedX = 10 * 16 - 320 / 2 + 16 / 2;
        const expectedY = 10 * 16 - 240 / 2 + 16 / 2;
        expect(camera.x).toBeGreaterThanOrEqual(expectedX - 1);
        expect(camera.x).toBeLessThanOrEqual(expectedX + 1);
        expect(camera.y).toBeGreaterThanOrEqual(expectedY - 1);
        expect(camera.y).toBeLessThanOrEqual(expectedY + 1);
    });

    describe('bounds clamping', () => {
        it('clamps to top-left when player is near origin', () => {
            updateCamera({ target: { x: 0, y: 0 }, ...defaultOpts, smoothing: 1.0 });
            expect(camera.x).toBe(0);
            expect(camera.y).toBe(0);
        });

        it('clamps to bottom-right when player is near map edge', () => {
            updateCamera({ target: { x: 99, y: 99 }, ...defaultOpts, smoothing: 1.0 });
            const maxX = 100 * 16 - 320;
            const maxY = 100 * 16 - 240;
            expect(camera.x).toBe(maxX);
            expect(camera.y).toBe(maxY);
        });

        it('does not go negative', () => {
            updateCamera({ target: { x: -5, y: -5 }, ...defaultOpts, smoothing: 1.0 });
            expect(camera.x).toBe(0);
            expect(camera.y).toBe(0);
        });

        it('does not exceed map bounds', () => {
            updateCamera({ target: { x: 200, y: 200 }, ...defaultOpts, smoothing: 1.0 });
            const maxX = 100 * 16 - 320;
            const maxY = 100 * 16 - 240;
            expect(camera.x).toBe(maxX);
            expect(camera.y).toBe(maxY);
        });

        it('handles map smaller than viewport', () => {
            updateCamera({ target: { x: 5, y: 5 }, tileSize: 16, mapWidth: 10, mapHeight: 10, smoothing: 1.0 });
            expect(camera.x).toBe(0);
            expect(camera.y).toBe(0);
        });

        it('clamps smoothly when approaching edge', () => {
            for (let i = 0; i < 50; i++) {
                updateCamera({ target: { x: 98, y: 98 }, ...defaultOpts, smoothing: 0.3 });
            }
            const maxX = 100 * 16 - 320;
            const maxY = 100 * 16 - 240;
            expect(camera.x).toBe(maxX);
            expect(camera.y).toBe(maxY);
        });
    });
});
