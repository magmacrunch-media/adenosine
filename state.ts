// engine/state.ts
// Centralized game state — the single source of truth for all engine modules.

import type { Player } from './types.js';

export let gameStarted: boolean = false;
export let gamePaused: boolean = false;
export let gameOver: boolean = false;

export function setGameStarted(val: boolean): void { gameStarted = val; }
export function setGamePaused(val: boolean): void { gamePaused = val; }
export function setGameOver(val: boolean): void { gameOver = val; }

export let currentMap: string = 'default';
export let map: number[][] | null = null;

export function setCurrentMap(val: string): void { currentMap = val; }
export function setMap(val: number[][] | null): void { map = val; }

export const player: Player = {
    x: 0, y: 0,
    facingX: 0, facingY: 1,
    direction: 'down',
    isWalking: false, wasMoving: false,
    health: 100, maxHealth: 100,
    positionLocked: false,
};

export let canvas: HTMLCanvasElement | null = null;
export let ctx: CanvasRenderingContext2D | null = null;

export function initCanvas(canvasEl: HTMLCanvasElement): void {
    canvas = canvasEl;
    ctx = canvasEl.getContext('2d');
}

export let animationFrame: number = 0;
export let frameCounter: number = 0;
export let waterAnimFrame: number = 0;
export let waterAnimCounter: number = 0;
export let campfireAnimFrame: number = 0;
export let campfireAnimCounter: number = 0;

export function setAnimationFrame(val: number): void { animationFrame = val; }
export function setFrameCounter(val: number): void { frameCounter = val; }
export function setWaterAnimFrame(val: number): void { waterAnimFrame = val; }
export function setWaterAnimCounter(val: number): void { waterAnimCounter = val; }
export function setCampfireAnimFrame(val: number): void { campfireAnimFrame = val; }
export function setCampfireAnimCounter(val: number): void { campfireAnimCounter = val; }

export let transitionCooldown: number = 0;
export function setTransitionCooldown(val: number): void { transitionCooldown = val; }
