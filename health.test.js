import { describe, it, expect, vi, beforeEach } from 'vitest';
import { player } from './state.js';
import { damagePlayer, healPlayer, setOnGameOverCallback } from './health.js';

beforeEach(() => {
    player.health = 100;
    player.maxHealth = 100;
    setOnGameOverCallback(null);
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
});
