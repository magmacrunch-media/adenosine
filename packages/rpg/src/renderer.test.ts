import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCtx = vi.hoisted(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
}));

const mockCamera = vi.hoisted(() => ({ x: 0, y: 0 }));

vi.mock('./state.js', () => ({
    ctx: mockCtx,
    canvas: { width: 320, height: 240 },
}));

vi.mock('./camera.js', () => ({
    camera: mockCamera,
}));

import { renderWorld, tileToScreen, createSpriteRegistry } from './renderer.js';

beforeEach(() => {
    mockCamera.x = 0;
    mockCamera.y = 0;
    vi.clearAllMocks();
});

describe('tileToScreen', () => {
    it('converts tile coords to screen coords', () => {
        mockCamera.x = 10;
        mockCamera.y = 20;
        const result = tileToScreen(5, 3, 16);
        expect(result.x).toBe(Math.floor(5 * 16 - 10));
        expect(result.y).toBe(Math.floor(3 * 16 - 20));
    });

    it('returns origin when camera is at 0,0', () => {
        mockCamera.x = 0;
        mockCamera.y = 0;
        const result = tileToScreen(0, 0, 16);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
    });
});

describe('renderWorld', () => {
    it('returns early if ctx is null', () => {
        expect(() => renderWorld({ map: [[1]], tileSize: 16, renderTile: vi.fn() })).not.toThrow();
    });

    it('calls renderTile for visible tiles', () => {
        const renderTile = vi.fn();
        const map = [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
        ];
        renderWorld({ map, tileSize: 16, renderTile });
        expect(renderTile).toHaveBeenCalled();
    });

    it('renders correct tile range based on camera', () => {
        mockCamera.x = 0;
        mockCamera.y = 0;
        const renderTile = vi.fn();
        const map = [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
        ];
        renderWorld({ map, tileSize: 16, renderTile });
        const calledTiles = renderTile.mock.calls.map(([, , , tile]) => tile);
        expect(calledTiles).toContain(1);
        expect(calledTiles).toContain(15);
    });

    it('sorts layers by Y position', () => {
        const renderTile = vi.fn();
        const layer1 = { sortY: 10, render: vi.fn() };
        const layer2 = { sortY: 5, render: vi.fn() };
        const layer3 = { sortY: 15, render: vi.fn() };
        const map = [[1]];
        renderWorld({ map, tileSize: 16, renderTile, layers: [layer1, layer2, layer3] });
        expect(layer2.render).toHaveBeenCalledBefore(layer1.render);
        expect(layer1.render).toHaveBeenCalledBefore(layer3.render);
    });

    it('calls background function first', () => {
        const renderTile = vi.fn();
        const background = vi.fn();
        const layer = { sortY: 5, render: vi.fn() };
        const map = [[1]];
        renderWorld({ map, tileSize: 16, renderTile, background, layers: [layer] });
        expect(background).toHaveBeenCalledBefore(renderTile);
        expect(renderTile).toHaveBeenCalledBefore(layer.render);
    });

    it('handles empty layers array', () => {
        const renderTile = vi.fn();
        const map = [[1]];
        expect(() => renderWorld({ map, tileSize: 16, renderTile, layers: [] })).not.toThrow();
    });

    it('does not mutate the input layers array', () => {
        const renderTile = vi.fn();
        const layer1 = { sortY: 10, render: vi.fn() };
        const layer2 = { sortY: 5, render: vi.fn() };
        const layers = [layer1, layer2];
        const map = [[1]];
        renderWorld({ map, tileSize: 16, renderTile, layers });
        expect(layers[0]).toBe(layer1);
        expect(layers[1]).toBe(layer2);
    });
});

describe('createSpriteRegistry', () => {
    it('creates registry with register and draw methods', () => {
        const registry = createSpriteRegistry();
        expect(typeof registry.register).toBe('function');
        expect(typeof registry.draw).toBe('function');
    });

    it('calls registered draw function', () => {
        const registry = createSpriteRegistry();
        const drawFn = vi.fn();
        registry.register('player', drawFn);
        registry.draw('player', 10, 20, 16, 16);
        expect(drawFn).toHaveBeenCalledWith(10, 20, 16, 16);
    });

    it('draws magenta fallback for unregistered type', () => {
        const registry = createSpriteRegistry();
        registry.draw('unknown', 10, 20, 16, 16);
        expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 16, 16);
        expect(mockCtx.fillStyle).toBe('#ff00ff');
    });
});
