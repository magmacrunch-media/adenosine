import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockState = {
    player: { x: 0, y: 0, facingX: 0, facingY: 1, direction: 'down', positionLocked: false },
    currentMap: 'default',
    transitionCooldown: 0,
    canvas: { width: 320, height: 240 },
};

vi.mock('./state.js', () => ({
    get player() { return mockState.player; },
    get currentMap() { return mockState.currentMap; },
    get transitionCooldown() { return mockState.transitionCooldown; },
    get canvas() { return mockState.canvas; },
    setCurrentMap: vi.fn((val) => { mockState.currentMap = val; }),
    setMap: vi.fn(),
    setTransitionCooldown: vi.fn((val) => { mockState.transitionCooldown = val; }),
}));

vi.mock('./camera.js', () => ({
    camera: { x: 0, y: 0 },
}));

import { transitionTo } from './transitions.js';
import { setCurrentMap, setMap, setTransitionCooldown } from './state.js';
import { camera } from './camera.js';

beforeEach(() => {
    mockState.player.x = 0;
    mockState.player.y = 0;
    mockState.player.facingX = 0;
    mockState.player.facingY = 1;
    mockState.player.direction = 'down';
    mockState.player.positionLocked = false;
    mockState.currentMap = 'default';
    mockState.transitionCooldown = 0;
    camera.x = 0;
    camera.y = 0;
    vi.clearAllMocks();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('transitionTo', () => {
    it('sets transition cooldown', () => {
        const maps = { forest: {} };
        transitionTo({ mapName: 'forest', maps, x: 5, y: 5 });
        expect(setTransitionCooldown).toHaveBeenCalledWith(30);
    });

    it('sets current map', () => {
        const maps = { forest: {} };
        transitionTo({ mapName: 'forest', maps, x: 5, y: 5 });
        expect(setCurrentMap).toHaveBeenCalledWith('forest');
    });

    it('sets map data', () => {
        const mapData = [[1, 2], [3, 4]];
        const maps = { forest: mapData };
        transitionTo({ mapName: 'forest', maps, x: 5, y: 5 });
        expect(setMap).toHaveBeenCalledWith(mapData);
    });

    it('moves player to spawn position', () => {
        const maps = { forest: {} };
        transitionTo({ mapName: 'forest', maps, x: 10, y: 15 });
        expect(mockState.player.x).toBe(10);
        expect(mockState.player.y).toBe(15);
    });

    it('locks player position', () => {
        const maps = { forest: {} };
        transitionTo({ mapName: 'forest', maps, x: 5, y: 5 });
        expect(mockState.player.positionLocked).toBe(true);
    });

    it('unlocks player position after timeout', () => {
        const maps = { forest: {} };
        transitionTo({ mapName: 'forest', maps, x: 5, y: 5 });
        expect(mockState.player.positionLocked).toBe(true);
        vi.advanceTimersByTime(1);
        expect(mockState.player.positionLocked).toBe(false);
    });

    describe('facing direction', () => {
        it('sets facing up', () => {
            const maps = { forest: {} };
            transitionTo({ mapName: 'forest', maps, x: 5, y: 5, facing: 'up' });
            expect(mockState.player.direction).toBe('up');
            expect(mockState.player.facingX).toBe(0);
            expect(mockState.player.facingY).toBe(-1);
        });

        it('sets facing down', () => {
            const maps = { forest: {} };
            transitionTo({ mapName: 'forest', maps, x: 5, y: 5, facing: 'down' });
            expect(mockState.player.direction).toBe('down');
            expect(mockState.player.facingX).toBe(0);
            expect(mockState.player.facingY).toBe(1);
        });

        it('sets facing left', () => {
            const maps = { forest: {} };
            transitionTo({ mapName: 'forest', maps, x: 5, y: 5, facing: 'left' });
            expect(mockState.player.direction).toBe('left');
            expect(mockState.player.facingX).toBe(-1);
            expect(mockState.player.facingY).toBe(0);
        });

        it('sets facing right', () => {
            const maps = { forest: {} };
            transitionTo({ mapName: 'forest', maps, x: 5, y: 5, facing: 'right' });
            expect(mockState.player.direction).toBe('right');
            expect(mockState.player.facingX).toBe(1);
            expect(mockState.player.facingY).toBe(0);
        });
    });

    it('snaps camera to player position', () => {
        const maps = { forest: {} };
        transitionTo({ mapName: 'forest', maps, x: 10, y: 10 });
        expect(camera.x).toBe(10 * 16 - 320 / 2);
        expect(camera.y).toBe(10 * 16 - 240 / 2);
    });

    describe('door exit scenarios', () => {
        it('transition works regardless of player direction', () => {
            const maps = { house: {} };
            mockState.player.direction = 'left';
            transitionTo({ mapName: 'house', maps, x: 5, y: 5 });
            expect(setCurrentMap).toHaveBeenCalledWith('house');
            expect(mockState.player.x).toBe(5);
            expect(mockState.player.y).toBe(5);
        });

        it('transition works when player faces right', () => {
            const maps = { house: {} };
            mockState.player.direction = 'right';
            transitionTo({ mapName: 'house', maps, x: 5, y: 5 });
            expect(setCurrentMap).toHaveBeenCalledWith('house');
        });

        it('transition works on diagonal approach', () => {
            const maps = { house: {} };
            mockState.player.direction = 'right';
            mockState.player.facingX = 1;
            mockState.player.facingY = 0;
            transitionTo({ mapName: 'house', maps, x: 5, y: 5 });
            expect(setCurrentMap).toHaveBeenCalledWith('house');
            expect(mockState.player.x).toBe(5);
            expect(mockState.player.y).toBe(5);
        });
    });

    describe('custom tile size', () => {
        it('uses default tile size of 16', () => {
            const maps = { forest: {} };
            transitionTo({ mapName: 'forest', maps, x: 10, y: 10 });
            expect(camera.x).toBe(10 * 16 - 320 / 2);
            expect(camera.y).toBe(10 * 16 - 240 / 2);
        });

        it('accepts custom tile size', () => {
            const maps = { forest: {} };
            transitionTo({ mapName: 'forest', maps, x: 10, y: 10, tileSize: 32 });
            expect(camera.x).toBe(10 * 32 - 320 / 2);
            expect(camera.y).toBe(10 * 32 - 240 / 2);
        });
    });
});
