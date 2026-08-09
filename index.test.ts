import { describe, it, expect } from 'vitest';
import * as engine from './index.js';

describe('index.js re-exports', () => {
    it('exports state module members', () => {
        expect(engine.player).toBeDefined();
        expect(engine.canvas).toBeDefined();
        expect(typeof engine.initCanvas).toBe('function');
        expect(typeof engine.setCurrentMap).toBe('function');
        expect(typeof engine.setMap).toBe('function');
        expect(typeof engine.setGameStarted).toBe('function');
        expect(typeof engine.setGamePaused).toBe('function');
        expect(typeof engine.setGameOver).toBe('function');
        expect(typeof engine.setTransitionCooldown).toBe('function');
        expect(engine.animationFrame).toBeDefined();
        expect(engine.frameCounter).toBeDefined();
        expect(engine.waterAnimFrame).toBeDefined();
        expect(engine.waterAnimCounter).toBeDefined();
        expect(engine.campfireAnimFrame).toBeDefined();
        expect(engine.campfireAnimCounter).toBeDefined();
    });

    it('exports game-loop module members', () => {
        expect(typeof engine.createGameLoop).toBe('function');
    });

    it('exports input module members', () => {
        expect(engine.keys).toBeDefined();
        expect(engine.keysPressed).toBeDefined();
        expect(typeof engine.initInput).toBe('function');
    });

    it('exports camera module members', () => {
        expect(engine.camera).toBeDefined();
        expect(typeof engine.updateCamera).toBe('function');
    });

    it('exports collision module members', () => {
        expect(typeof engine.isSolid).toBe('function');
    });

    it('exports movement module members', () => {
        expect(typeof engine.handleMovement).toBe('function');
    });

    it('exports renderer module members', () => {
        expect(typeof engine.renderWorld).toBe('function');
        expect(typeof engine.tileToScreen).toBe('function');
        expect(typeof engine.createSpriteRegistry).toBe('function');
    });

    it('exports inventory module members', () => {
        expect(typeof engine.createInventory).toBe('function');
    });

    it('exports notifications module members', () => {
        expect(typeof engine.showNotification).toBe('function');
    });

    it('exports health module members', () => {
        expect(typeof engine.damagePlayer).toBe('function');
        expect(typeof engine.healPlayer).toBe('function');
        expect(typeof engine.setOnGameOverCallback).toBe('function');
    });

    it('exports transitions module members', () => {
        expect(typeof engine.transitionTo).toBe('function');
    });

    it('exports expected number of members', () => {
        const keys = Object.keys(engine);
        expect(keys.length).toBeGreaterThanOrEqual(30);
    });
});
