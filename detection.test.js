import { describe, it, expect } from 'vitest';
import { getEntityInFront, isFacingProp, isNearProp } from './detection.js';

describe('getEntityInFront', () => {
    const player = { x: 5, y: 5, facingX: 0, facingY: -1 };

    it('finds entity at facing tile', () => {
        const entities = [{ x: 5, y: 4, name: 'npc1' }];
        expect(getEntityInFront(player, entities)).toBe(entities[0]);
    });

    it('returns null when no entity at facing tile', () => {
        const entities = [{ x: 5, y: 6, name: 'npc1' }];
        expect(getEntityInFront(player, entities)).toBeNull();
    });

    it('returns null for empty entities array', () => {
        expect(getEntityInFront(player, [])).toBeNull();
    });

    it('respects threshold', () => {
        const entities = [{ x: 5.5, y: 4.5, name: 'npc1' }];
        expect(getEntityInFront(player, entities, { threshold: 0.8 })).not.toBeNull();
        expect(getEntityInFront(player, entities, { threshold: 0.1 })).toBeNull();
    });

    it('filters by map', () => {
        const entities = [
            { x: 5, y: 4, name: 'npc1', map: 'forest' },
            { x: 5, y: 4, name: 'npc2', map: 'cave' },
        ];
        expect(getEntityInFront(player, entities, { map: 'forest' }).name).toBe('npc1');
        expect(getEntityInFront(player, entities, { map: 'cave' }).name).toBe('npc2');
        expect(getEntityInFront(player, entities, { map: 'town' })).toBeNull();
    });

    it('applies custom filter', () => {
        const entities = [
            { x: 5, y: 4, name: 'npc1', type: 'friendly' },
            { x: 5, y: 4, name: 'npc2', type: 'enemy' },
        ];
        const result = getEntityInFront(player, entities, { filter: e => e.type === 'enemy' });
        expect(result.name).toBe('npc2');
    });

    it('works with left-facing player', () => {
        const p = { x: 5, y: 5, facingX: -1, facingY: 0 };
        const entities = [{ x: 4, y: 5, name: 'npc1' }];
        expect(getEntityInFront(p, entities)).toBe(entities[0]);
    });

    it('works with right-facing player', () => {
        const p = { x: 5, y: 5, facingX: 1, facingY: 0 };
        const entities = [{ x: 6, y: 5, name: 'npc1' }];
        expect(getEntityInFront(p, entities)).toBe(entities[0]);
    });

    it('works with down-facing player', () => {
        const p = { x: 5, y: 5, facingX: 0, facingY: 1 };
        const entities = [{ x: 5, y: 6, name: 'npc1' }];
        expect(getEntityInFront(p, entities)).toBe(entities[0]);
    });
});

describe('isFacingProp', () => {
    it('returns true for single-tile prop at facing tile', () => {
        const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
        expect(isFacingProp(player, { x: 5, y: 4 })).toBe(true);
    });

    it('returns false for single-tile prop not at facing tile', () => {
        const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
        expect(isFacingProp(player, { x: 5, y: 6 })).toBe(false);
    });

    it('returns true for multi-tile prop at any tile', () => {
        const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
        const prop = { x: 4, y: 3, width: 3, height: 2 };
        expect(isFacingProp(player, prop)).toBe(true);
    });

    it('returns false for multi-tile prop not at any tile', () => {
        const player = { x: 5, y: 5, facingX: 0, facingY: -1 };
        const prop = { x: 10, y: 10, width: 2, height: 2 };
        expect(isFacingProp(player, prop)).toBe(false);
    });

    it('handles left-facing', () => {
        const player = { x: 5, y: 5, facingX: -1, facingY: 0 };
        expect(isFacingProp(player, { x: 4, y: 5 })).toBe(true);
    });

    it('handles right-facing', () => {
        const player = { x: 5, y: 5, facingX: 1, facingY: 0 };
        expect(isFacingProp(player, { x: 6, y: 5 })).toBe(true);
    });
});

describe('isNearProp', () => {
    it('returns true when player is near single-tile prop', () => {
        const player = { x: 5, y: 5 };
        expect(isNearProp(player, { x: 5, y: 5 })).toBe(true);
    });

    it('returns true when player is within threshold', () => {
        const player = { x: 5, y: 5 };
        expect(isNearProp(player, { x: 6, y: 5 }, 2.0)).toBe(true);
    });

    it('returns false when player is far away', () => {
        const player = { x: 5, y: 5 };
        expect(isNearProp(player, { x: 20, y: 20 })).toBe(false);
    });

    it('returns true for multi-tile prop when near any tile', () => {
        const player = { x: 5, y: 5 };
        const prop = { x: 7, y: 7, width: 2, height: 2 };
        expect(isNearProp(player, prop, 7.0)).toBe(true);
    });

    it('returns false for multi-tile prop when far from all tiles', () => {
        const player = { x: 5, y: 5 };
        const prop = { x: 20, y: 20, width: 2, height: 2 };
        expect(isNearProp(player, prop, 2.0)).toBe(false);
    });

    it('uses default threshold of 2.0', () => {
        const player = { x: 5, y: 5 };
        expect(isNearProp(player, { x: 6, y: 5 })).toBe(true);
        expect(isNearProp(player, { x: 7, y: 5 })).toBe(false);
    });
});
