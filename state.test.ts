import { describe, it, expect, beforeEach } from 'vitest';
import {
    gameStarted, gamePaused, gameOver,
    setGameStarted, setGamePaused, setGameOver,
    currentMap, setCurrentMap,
    player,
    animationFrame, frameCounter, waterAnimFrame, waterAnimCounter, campfireAnimFrame, campfireAnimCounter,
    setAnimationFrame, setFrameCounter, setWaterAnimFrame, setWaterAnimCounter, setCampfireAnimFrame, setCampfireAnimCounter,
    transitionCooldown, setTransitionCooldown,
} from './state.js';

describe('game flags', () => {
    beforeEach(() => {
        setGameStarted(false);
        setGamePaused(false);
        setGameOver(false);
    });

    it('setGameStarted toggles gameStarted', () => {
        setGameStarted(true);
        expect(gameStarted).toBe(true);
    });

    it('setGamePaused toggles gamePaused', () => {
        setGamePaused(true);
        expect(gamePaused).toBe(true);
    });

    it('setGameOver toggles gameOver', () => {
        setGameOver(true);
        expect(gameOver).toBe(true);
    });
});

describe('map state', () => {
    it('setCurrentMap updates currentMap', () => {
        setCurrentMap('forest');
        expect(currentMap).toBe('forest');
    });
});

describe('player', () => {
    it('has default position and stats', () => {
        expect(player.x).toBe(0);
        expect(player.y).toBe(0);
        expect(player.health).toBe(100);
        expect(player.maxHealth).toBe(100);
        expect(player.direction).toBe('down');
        expect(player.positionLocked).toBe(false);
    });
});

describe('animation counters', () => {
    beforeEach(() => {
        setAnimationFrame(0);
        setFrameCounter(0);
        setWaterAnimFrame(0);
        setWaterAnimCounter(0);
        setCampfireAnimFrame(0);
        setCampfireAnimCounter(0);
    });

    it('setAnimationFrame updates value', () => {
        setAnimationFrame(5);
        expect(animationFrame).toBe(5);
    });

    it('setFrameCounter updates value', () => {
        setFrameCounter(10);
        expect(frameCounter).toBe(10);
    });

    it('setWaterAnimFrame updates value', () => {
        setWaterAnimFrame(3);
        expect(waterAnimFrame).toBe(3);
    });

    it('setWaterAnimCounter updates value', () => {
        setWaterAnimCounter(7);
        expect(waterAnimCounter).toBe(7);
    });

    it('setCampfireAnimFrame updates value', () => {
        setCampfireAnimFrame(2);
        expect(campfireAnimFrame).toBe(2);
    });

    it('setCampfireAnimCounter updates value', () => {
        setCampfireAnimCounter(4);
        expect(campfireAnimCounter).toBe(4);
    });
});

describe('transitionCooldown', () => {
    it('setTransitionCooldown updates value', () => {
        setTransitionCooldown(30);
        expect(transitionCooldown).toBe(30);
    });
});
