// engine/reset.ts
// Put the engine back to the state it had at import time.

import { player, setMap, setCurrentMap, setGameStarted, setGamePaused, setGameOver, setTransitionCooldown, setAnimationFrame, setFrameCounter, setWaterAnimFrame, setWaterAnimCounter, setCampfireAnimFrame, setCampfireAnimCounter } from './state.js';
import { camera } from './camera.js';
import { resetInput } from './input.js';
import { engine } from './events.js';
import { setOnGameOverCallback } from './health.js';

/**
 * Reset every piece of engine-wide state.
 *
 * The engine keeps `player`, `map`, `camera`, `keys` and `engine` as one shared
 * copy each, created at import time. That is deliberate — one game per page —
 * but it left no way back to the starting values, and a page that runs a second
 * scene without reloading inherits everything the first one did.
 *
 * Which is not hypothetical. Three of the playground examples open with
 * `player.health = 100` and five do not, because the author of those three hit
 * a half-dead player left over from a previous run. Sixteen of this package's
 * test files reset the same globals in `beforeEach`. Both are this function,
 * written by hand and incompletely.
 *
 * Call it before starting a new scene. It deliberately leaves the canvas and
 * its 2D context bound: those are a render target rather than game state, and
 * clearing them would force an `initCanvas()` on a caller who only wanted to
 * restart a level. Input listeners *are* detached — a scene being torn down
 * should stop hearing about keys — so a new scene calls `initInput()` again.
 */
export function resetEngine(): void {
    player.x = 0;
    player.y = 0;
    player.facingX = 0;
    player.facingY = 1;
    player.direction = 'down';
    player.isWalking = false;
    player.wasMoving = false;
    player.health = 100;
    player.maxHealth = 100;
    player.positionLocked = false;

    setMap([]);
    setCurrentMap('default');

    setGameStarted(false);
    setGamePaused(false);
    setGameOver(false);
    setTransitionCooldown(0);

    setAnimationFrame(0);
    setFrameCounter(0);
    setWaterAnimFrame(0);
    setWaterAnimCounter(0);
    setCampfireAnimFrame(0);
    setCampfireAnimCounter(0);

    camera.x = 0;
    camera.y = 0;

    // Detaches the window listeners and empties the held-key maps.
    resetInput();

    // A game-over callback outlives the scene that installed it and closes over
    // that scene's DOM, so it has to go with everything else.
    setOnGameOverCallback(null);

    // Last, because clearing listeners means nothing above can announce itself.
    engine.clear();
}
