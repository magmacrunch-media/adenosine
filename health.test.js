import { describe, it, expect, vi, beforeEach } from 'vitest';
import { player } from './state.js';
import { damagePlayer, healPlayer, setOnGameOverCallback } from './health.js';
import { engine } from './events.js';

beforeEach(() => {
    player.health = 100;
    player.maxHealth = 100;
    setOnGameOverCallback(null);
    engine.off('health-changed', () => {});
    engine.off('player-died', () => {});
});

describe('damagePlayer', () => {
    it('reduces health by amount', () => {
        damagePlayer(30);
        expect(player.health).toBe(70);
    });

    it('does not reduce health below 0', () => {
        damagePlayer(150);
        expect(player.health).toBe(0);
    });

    it('calls game over callback when health reaches 0', () => {
        const cb = vi.fn();
        setOnGameOverCallback(cb);
        damagePlayer(100);
        expect(cb).toHaveBeenCalledOnce();
    });

    it('does not call game over callback when health > 0', () => {
        const cb = vi.fn();
        setOnGameOverCallback(cb);
        damagePlayer(50);
        expect(cb).not.toHaveBeenCalled();
    });

    it('does not call game over callback when no callback set', () => {
        expect(() => damagePlayer(100)).not.toThrow();
    });
});

describe('healPlayer', () => {
    it('increases health by amount', () => {
        player.health = 50;
        healPlayer(20);
        expect(player.health).toBe(70);
    });

    it('does not exceed maxHealth', () => {
        player.health = 90;
        healPlayer(20);
        expect(player.health).toBe(100);
    });

    it('heals from 0', () => {
        player.health = 0;
        healPlayer(10);
        expect(player.health).toBe(10);
    });

    it('ignores negative amounts', () => {
        player.health = 50;
        healPlayer(-10);
        expect(player.health).toBe(50);
    });

    it('ignores zero amount', () => {
        player.health = 50;
        healPlayer(0);
        expect(player.health).toBe(50);
    });
});

describe('damagePlayer validation', () => {
    it('ignores negative amounts', () => {
        player.health = 50;
        damagePlayer(-10);
        expect(player.health).toBe(50);
    });

    it('ignores zero amount', () => {
        player.health = 50;
        damagePlayer(0);
        expect(player.health).toBe(50);
    });

    it('does not fire game-over callback when already at 0 health', () => {
        player.health = 0;
        const cb = vi.fn();
        setOnGameOverCallback(cb);
        damagePlayer(10);
        expect(cb).not.toHaveBeenCalled();
    });
});

describe('health events', () => {
    it('emits health-changed on damage', () => {
        const fn = vi.fn();
        engine.on('health-changed', fn);
        damagePlayer(30);
        expect(fn).toHaveBeenCalledWith({ health: 70, maxHealth: 100 });
        engine.off('health-changed', fn);
    });

    it('emits health-changed on heal', () => {
        player.health = 50;
        const fn = vi.fn();
        engine.on('health-changed', fn);
        healPlayer(20);
        expect(fn).toHaveBeenCalledWith({ health: 70, maxHealth: 100 });
        engine.off('health-changed', fn);
    });

    it('emits player-died on death', () => {
        const fn = vi.fn();
        engine.on('player-died', fn);
        damagePlayer(100);
        expect(fn).toHaveBeenCalledWith({ health: 0 });
        engine.off('player-died', fn);
    });

    it('does not emit health-changed for negative amounts', () => {
        const fn = vi.fn();
        engine.on('health-changed', fn);
        damagePlayer(-10);
        expect(fn).not.toHaveBeenCalled();
        engine.off('health-changed', fn);
    });
});
