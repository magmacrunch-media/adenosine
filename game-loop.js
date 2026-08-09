// engine/game-loop.js
// Configurable game loop with FPS limiting.
// Usage:
//   import { createGameLoop } from './engine/game-loop.js';
//   const loop = createGameLoop({ update, render, fps: 30 });
//   loop.start();

import { gameStarted, gamePaused, gameOver, canvas, ctx } from './state.js';

export function createGameLoop({ update, render, fps = 30 } = {}) {
    const targetFrameTime = 1000 / fps;
    let lastFrameTime = 0;
    let accumulatedTime = 0;
    let rafId = null;

    function gameLoop(currentTime = 0) {
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
