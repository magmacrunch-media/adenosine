import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockClearRect = vi.hoisted(() => vi.fn());

vi.mock('./state.js', () => ({
    gameStarted: true,
    gamePaused: false,
    gameOver: false,
    canvas: { width: 320, height: 240 },
    ctx: { clearRect: mockClearRect },
}));

import { createGameLoop } from './game-loop.js';

let rafCallbacks;

beforeEach(() => {
    rafCallbacks = [];
    vi.stubGlobal('requestAnimationFrame', (cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
    });
    mockClearRect.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createGameLoop', () => {
    it('returns start and stop functions', () => {
        const loop = createGameLoop();
        expect(typeof loop.start).toBe('function');
        expect(typeof loop.stop).toBe('function');
    });

    it('calls update when enough time has passed', () => {
        const update = vi.fn();
        const loop = createGameLoop({ update, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);

        expect(update).toHaveBeenCalled();
    });

    it('does not call update before target frame time', () => {
        const update = vi.fn();
        const loop = createGameLoop({ update, fps: 30 });
        loop.start();

        rafCallbacks[0](100);
        rafCallbacks[0](110);

        expect(update).not.toHaveBeenCalled();
    });

    it('calls render when gameStarted is true', () => {
        const render = vi.fn();
        const loop = createGameLoop({ render, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);

        expect(render).toHaveBeenCalled();
    });

    it('calls ctx.clearRect', () => {
        const loop = createGameLoop({ fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);

        expect(mockClearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    });

    it('stop resets lastFrameTime', () => {
        const update = vi.fn();
        const loop = createGameLoop({ update, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);
        expect(update).toHaveBeenCalledOnce();

        loop.stop();
        loop.start();
        update.mockClear();

        rafCallbacks[0](500);
        rafCallbacks[0](500 + 10);
        expect(update).not.toHaveBeenCalled();
    });
});
