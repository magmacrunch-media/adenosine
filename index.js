// engine/index.js
// Magma Engine — main entry point.
// Import everything from here, or import individual modules.

export { player, canvas, ctx, initCanvas, currentMap, setCurrentMap, setMap, gameStarted, setGameStarted, gamePaused, setGamePaused, gameOver, setGameOver, transitionCooldown, setTransitionCooldown, animationFrame, frameCounter, waterAnimFrame, waterAnimCounter, campfireAnimFrame, campfireAnimCounter } from './state.js';
export { createGameLoop } from './game-loop.js';
export { keys, keysPressed, initInput } from './input.js';
export { camera, updateCamera } from './camera.js';
export { isSolid } from './collision.js';
export { handleMovement } from './movement.js';
export { renderWorld, tileToScreen, createSpriteRegistry } from './renderer.js';
export { createInventory } from './inventory.js';
export { showNotification } from './notifications.js';
export { damagePlayer, healPlayer, setOnGameOverCallback } from './health.js';
export { transitionTo } from './transitions.js';
