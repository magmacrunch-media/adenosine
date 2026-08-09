// engine/state.js
// Centralized game state — the single source of truth for all engine modules.

export let gameStarted = false;
export let gamePaused = false;
export let gameOver = false;

export function setGameStarted(val) { gameStarted = val; }
export function setGamePaused(val) { gamePaused = val; }
export function setGameOver(val) { gameOver = val; }

export let currentMap = 'default';
export let map = null;

export function setCurrentMap(val) { currentMap = val; }
export function setMap(val) { map = val; }

export const player = {
    x: 0, y: 0,
    facingX: 0, facingY: 1,
    direction: 'down',
    isWalking: false, wasMoving: false,
    health: 100, maxHealth: 100,
    positionLocked: false,
};

export let canvas = null;
export let ctx = null;

export function initCanvas(canvasEl) {
    canvas = canvasEl;
    ctx = canvasEl.getContext('2d');
}

export let animationFrame = 0;
export let frameCounter = 0;
export let waterAnimFrame = 0;
export let waterAnimCounter = 0;
export let campfireAnimFrame = 0;
export let campfireAnimCounter = 0;

export function setAnimationFrame(val) { animationFrame = val; }
export function setFrameCounter(val) { frameCounter = val; }
export function setWaterAnimFrame(val) { waterAnimFrame = val; }
export function setWaterAnimCounter(val) { waterAnimCounter = val; }
export function setCampfireAnimFrame(val) { campfireAnimFrame = val; }
export function setCampfireAnimCounter(val) { campfireAnimCounter = val; }

export let transitionCooldown = 0;
export function setTransitionCooldown(val) { transitionCooldown = val; }
