import { describe, it, expect, vi } from 'vitest';
import { createEntityManager } from './entities.js';

describe('createEntityManager', () => {
    describe('NPCs', () => {
        it('addNPC creates and returns NPC', () => {
            const mgr = createEntityManager();
            const npc = mgr.addNPC({ x: 5, y: 3, name: 'Wizard', map: 'forest' });
            expect(npc.x).toBe(5);
            expect(npc.name).toBe('Wizard');
            expect(npc.map).toBe('forest');
        });

        it('getNPCs returns all NPCs', () => {
            const mgr = createEntityManager();
            mgr.addNPC({ x: 1, y: 1, map: 'forest' });
            mgr.addNPC({ x: 2, y: 2, map: 'cave' });
            expect(mgr.getNPCs()).toHaveLength(2);
        });

        it('getNPCs filters by map', () => {
            const mgr = createEntityManager();
            mgr.addNPC({ x: 1, y: 1, map: 'forest' });
            mgr.addNPC({ x: 2, y: 2, map: 'cave' });
            expect(mgr.getNPCs('forest')).toHaveLength(1);
            expect(mgr.getNPCs('cave')).toHaveLength(1);
            expect(mgr.getNPCs('town')).toHaveLength(0);
        });

        it('NPC defaults to direction down', () => {
            const mgr = createEntityManager();
            const npc = mgr.addNPC({ x: 0, y: 0 });
            expect(npc.direction).toBe('down');
        });

        it('NPC defaults dialogue to empty array', () => {
            const mgr = createEntityManager();
            const npc = mgr.addNPC({ x: 0, y: 0 });
            expect(npc.dialogue).toEqual([]);
        });
    });

    describe('enemies', () => {
        it('addEnemy creates and returns enemy', () => {
            const mgr = createEntityManager();
            const enemy = mgr.addEnemy({ x: 10, y: 5, map: 'dungeon', damage: 20 });
            expect(enemy.x).toBe(10);
            expect(enemy.damage).toBe(20);
            expect(enemy.startX).toBe(10);
        });

        it('getEnemies returns all enemies', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 1, y: 1 });
            mgr.addEnemy({ x: 2, y: 2 });
            expect(mgr.getEnemies()).toHaveLength(2);
        });

        it('getEnemies filters by map', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 1, y: 1, map: 'dungeon' });
            mgr.addEnemy({ x: 2, y: 2, map: 'cave' });
            expect(mgr.getEnemies('dungeon')).toHaveLength(1);
        });

        it('enemy defaults to patrolAxis x', () => {
            const mgr = createEntityManager();
            const enemy = mgr.addEnemy({ x: 5, y: 5 });
            expect(enemy.direction).toBe(1);
            expect(enemy.moveCounter).toBe(0);
        });
    });

    describe('updateEnemies', () => {
        it('moves enemy within patrol range', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 5, y: 5, map: 'dungeon', moveSpeed: 1, patrolRange: 3 });
            const isSolid = vi.fn(() => false);
            mgr.updateEnemies('dungeon', isSolid);
            expect(mgr.getEnemies('dungeon')[0].x).toBe(6);
        });

        it('reverses direction at patrol range boundary', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 8, y: 5, map: 'dungeon', moveSpeed: 1, patrolRange: 1 });
            const isSolid = vi.fn(() => false);
            mgr.updateEnemies('dungeon', isSolid);
            mgr.updateEnemies('dungeon', isSolid);
            expect(mgr.getEnemies('dungeon')[0].direction).toBe(-1);
        });

        it('reverses direction on solid tile', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 5, y: 5, map: 'dungeon', moveSpeed: 1, patrolRange: 10 });
            const isSolid = vi.fn((x) => x === 6);
            mgr.updateEnemies('dungeon', isSolid);
            expect(mgr.getEnemies('dungeon')[0].direction).toBe(-1);
        });

        it('does not move before moveSpeed threshold', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 5, y: 5, map: 'dungeon', moveSpeed: 3 });
            const isSolid = vi.fn(() => false);
            mgr.updateEnemies('dungeon', isSolid);
            mgr.updateEnemies('dungeon', isSolid);
            expect(mgr.getEnemies('dungeon')[0].x).toBe(5);
        });

        it('only updates enemies on current map', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 5, y: 5, map: 'dungeon', moveSpeed: 1 });
            mgr.addEnemy({ x: 10, y: 5, map: 'cave', moveSpeed: 1 });
            const isSolid = vi.fn(() => false);
            mgr.updateEnemies('dungeon', isSolid);
            expect(mgr.getEnemies('dungeon')[0].x).toBe(6);
            expect(mgr.getEnemies('cave')[0].x).toBe(10);
        });
    });

    describe('checkEnemyCollisions', () => {
        it('returns enemy when player overlaps', () => {
            const mgr = createEntityManager();
            const enemy = mgr.addEnemy({ x: 5, y: 5, map: 'dungeon' });
            const cb = vi.fn();
            const result = mgr.checkEnemyCollisions(5, 5, 'dungeon', cb);
            expect(result).toBe(enemy);
            expect(cb).toHaveBeenCalled();
        });

        it('returns null when no collision', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 5, y: 5, map: 'dungeon' });
            const cb = vi.fn();
            expect(mgr.checkEnemyCollisions(20, 20, 'dungeon', cb)).toBeNull();
            expect(cb).not.toHaveBeenCalled();
        });

        it('only checks enemies on current map', () => {
            const mgr = createEntityManager();
            mgr.addEnemy({ x: 5, y: 5, map: 'cave' });
            const cb = vi.fn();
            expect(mgr.checkEnemyCollisions(5, 5, 'dungeon', cb)).toBeNull();
        });
    });

    describe('getNPCInFront', () => {
        it('finds NPC at facing tile', () => {
            const mgr = createEntityManager();
            mgr.addNPC({ x: 5, y: 4, map: 'forest' });
            const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
            expect(mgr.getNPCInFront(player, 'forest')).not.toBeNull();
        });

        it('returns null when no NPC at facing tile', () => {
            const mgr = createEntityManager();
            mgr.addNPC({ x: 5, y: 6, map: 'forest' });
            const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
            expect(mgr.getNPCInFront(player, 'forest')).toBeNull();
        });

        it('returns null when NPC is on different map', () => {
            const mgr = createEntityManager();
            mgr.addNPC({ x: 5, y: 4, map: 'cave' });
            const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
            expect(mgr.getNPCInFront(player, 'forest')).toBeNull();
        });

        it('works with left-facing player', () => {
            const mgr = createEntityManager();
            mgr.addNPC({ x: 4, y: 5, map: 'forest' });
            const player = { x: 5, y: 5, facingX: -1, facingY: 0 };
            expect(mgr.getNPCInFront(player, 'forest')).not.toBeNull();
        });
    });
});
