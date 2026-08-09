import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockClearRect = vi.hoisted(() => vi.fn());
const mockCancelAnimationFrame = vi.hoisted(() => vi.fn());

const mockState = vi.hoisted(() => ({
    gameStarted: true,
    gamePaused: false,
    gameOver: false,
    canvas: { width: 320, height: 240 },
    ctx: { clearRect: mockClearRect },
}));

vi.mock('./state.js', () => ({
    get gameStarted() { return mockState.gameStarted; },
    get gamePaused() { return mockState.gamePaused; },
    get gameOver() { return mockState.gameOver; },
    get canvas() { return mockState.canvas; },
    get ctx() { return mockState.ctx; },
}));

import { createGameLoop } from './game-loop.js';

let rafCallbacks;
let rafIdCounter;

beforeEach(() => {
    rafCallbacks = [];
    rafIdCounter = 0;
    mockState.gamePaused = false;
    mockState.gameOver = false;
    vi.stubGlobal('requestAnimationFrame', (cb) => {
        rafCallbacks.push(cb);
        return ++rafIdCounter;
    });
    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);
    mockClearRect.mockClear();
    mockCancelAnimationFrame.mockClear();
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

    it('passes deltaFactor to update', () => {
        const update = vi.fn();
        const loop = createGameLoop({ update, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime * 1.5);

        expect(update).toHaveBeenCalledWith(1.5);
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

    it('stop cancels animation frame and prevents further updates', () => {
        const update = vi.fn();
        const loop = createGameLoop({ update, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);
        expect(update).toHaveBeenCalledOnce();

        loop.stop();
        expect(mockCancelAnimationFrame).toHaveBeenCalled();
        update.mockClear();
        rafCallbacks = [];
    });

    it('stop resets accumulated time so next frame does not trigger immediately', () => {
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

    it('skips update when gamePaused is true', () => {
        mockState.gamePaused = true;
        const update = vi.fn();
        const loop = createGameLoop({ update, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);

        expect(update).not.toHaveBeenCalled();
    });

    it('skips update and render when gameOver is true', () => {
        mockState.gameOver = true;
        const update = vi.fn();
        const render = vi.fn();
        const loop = createGameLoop({ update, render, fps: 30 });
        loop.start();

        const targetFrameTime = 1000 / 30;
        rafCallbacks[0](100);
        rafCallbacks[0](100 + targetFrameTime + 1);

        expect(update).not.toHaveBeenCalled();
        expect(render).not.toHaveBeenCalled();
    });
});
