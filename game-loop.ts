// engine/game-loop.ts
// Configurable game loop with FPS limiting.

import { gameStarted, gamePaused, gameOver, canvas, ctx } from './state.js';
import type { GameLoopOpts, GameLoop } from './types.js';

export function createGameLoop({ update, render, fps = 30 }: GameLoopOpts = {}): GameLoop {
    const targetFrameTime = 1000 / fps;
    let lastFrameTime = 0;
    let accumulatedTime = 0;
    let rafId: number | null = null;

    function gameLoop(currentTime: number = 0): void {
        rafId = requestAnimationFrame(gameLoop);

        if (!lastFrameTime) lastFrameTime = currentTime;
        const deltaTime = currentTime - lastFrameTime;
        accumulatedTime += deltaTime;

        if (accumulatedTime >= targetFrameTime) {
            const deltaFactor = accumulatedTime / targetFrameTime;
            accumulatedTime = accumulatedTime % targetFrameTime;

            if (!gamePaused && !gameOver && update) {
                update(deltaFactor);
            }

            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            if (gameStarted && !gameOver && render) {
                render();
            }
        }

        lastFrameTime = currentTime;
    }

    return {
        start: () => { rafId = requestAnimationFrame(gameLoop); },
        stop: () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            lastFrameTime = 0;
            accumulatedTime = 0;
        },
    };
}
