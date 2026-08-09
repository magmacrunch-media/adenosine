import { describe, it, expect, beforeEach } from 'vitest';
import {
    gameStarted, gamePaused, gameOver,
    setGameStarted, setGamePaused, setGameOver,
    currentMap, setCurrentMap,
    player,
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
