import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keys } from './input.js';
import { handleMovement } from './movement.js';

vi.mock('./input.js', () => ({
    keys: {},
}));

vi.mock('./collision.js', () => ({
    isSolid: vi.fn(() => false),
}));

import { isSolid } from './collision.js';

function createPlayer(x = 0, y = 0) {
    return {
        x, y,
        facingX: 0, facingY: 1,
        direction: 'down',
        isWalking: false, wasMoving: false,
    };
}

beforeEach(() => {
    for (const key of Object.keys(keys)) {
        delete keys[key];
    }
    isSolid.mockReset();
    isSolid.mockReturnValue(false);
});

describe('handleMovement', () => {
    it('returns false when no movement keys pressed', () => {
        const player = createPlayer();
        expect(handleMovement(player)).toBeFalsy();
        expect(player.isWalking).toBeFalsy();
    });

    it('sets isWalking to true when movement key pressed', () => {
        const player = createPlayer();
        keys['w'] = true;
        handleMovement(player);
        expect(player.isWalking).toBe(true);
    });

    it('returns true when movement key pressed', () => {
        const player = createPlayer();
        keys['w'] = true;
        expect(handleMovement(player)).toBe(true);
    });

    describe('direction', () => {
        it('moves up when w pressed', () => {
            const player = createPlayer(5, 5);
            keys['w'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.y).toBeLessThan(5);
            expect(player.direction).toBe('up');
            expect(player.facingY).toBe(-1);
        });

        it('moves down when s pressed', () => {
            const player = createPlayer(5, 5);
            keys['s'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.y).toBeGreaterThan(5);
            expect(player.direction).toBe('down');
            expect(player.facingY).toBe(1);
        });

        it('moves left when a pressed', () => {
            const player = createPlayer(5, 5);
            keys['a'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.x).toBeLessThan(5);
            expect(player.direction).toBe('left');
            expect(player.facingX).toBe(-1);
        });

        it('moves right when d pressed', () => {
            const player = createPlayer(5, 5);
            keys['d'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.x).toBeGreaterThan(5);
            expect(player.direction).toBe('right');
            expect(player.facingX).toBe(1);
        });

        it('moves up when arrowup pressed', () => {
            const player = createPlayer(5, 5);
            keys['arrowup'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.y).toBeLessThan(5);
        });

        it('moves down when arrowdown pressed', () => {
            const player = createPlayer(5, 5);
            keys['arrowdown'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.y).toBeGreaterThan(5);
        });

        it('moves left when arrowleft pressed', () => {
            const player = createPlayer(5, 5);
            keys['arrowleft'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.x).toBeLessThan(5);
        });

        it('moves right when arrowright pressed', () => {
            const player = createPlayer(5, 5);
            keys['arrowright'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.x).toBeGreaterThan(5);
        });
    });

    describe('diagonal movement', () => {
        it('normalizes diagonal movement', () => {
            const player = createPlayer(5, 5);
            keys['w'] = true;
            keys['d'] = true;
            handleMovement(player, { speed: 1 });
            const dx = Math.abs(player.x - 5);
            const dy = Math.abs(player.y - 5);
            expect(dx).toBeCloseTo(0.707, 2);
            expect(dy).toBeCloseTo(0.707, 2);
        });
    });

    describe('collision', () => {
        it('does not move when blocked', () => {
            isSolid.mockReturnValue(true);
            const player = createPlayer(5, 5);
            keys['w'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.x).toBe(5);
            expect(player.y).toBe(5);
        });

        it('allows movement on free axis', () => {
            isSolid.mockImplementation((x, y) => y !== 5);
            const player = createPlayer(5, 5);
            keys['w'] = true;
            keys['d'] = true;
            handleMovement(player, { speed: 1 });
            expect(player.x).toBeGreaterThan(5);
            expect(player.y).toBe(5);
        });
    });

    describe('isBlocked callback', () => {
        it('does not move when isBlocked returns true', () => {
            const player = createPlayer(5, 5);
            keys['w'] = true;
            handleMovement(player, { isBlocked: () => true });
            expect(player.x).toBe(5);
            expect(player.y).toBe(5);
            expect(player.isWalking).toBe(false);
        });
    });

    describe('door boundary movement', () => {
        it('player moves onto tile adjacent to solid wall below (exit trigger scenario)', () => {
            isSolid.mockImplementation((x, y) => y >= 6);
            const player = createPlayer(3, 5.2);
            keys['s'] = true;
            handleMovement(player, { speed: 0.4 });
            expect(player.y).toBeGreaterThan(5.2);
            expect(player.y).toBeLessThan(6);
        });

        it('per-axis collision allows X movement when Y is blocked by door wall', () => {
            isSolid.mockImplementation((x, y) => y >= 6);
            const player = createPlayer(3, 5.8);
            keys['d'] = true;
            keys['s'] = true;
            handleMovement(player, { speed: 0.4 });
            expect(player.x).toBeGreaterThan(3);
            expect(player.y).toBe(5.8);
        });

        it('diagonal movement near solid tiles does not clip through', () => {
            isSolid.mockImplementation((x, y) => y >= 6);
            const player = createPlayer(3, 5.8);
            keys['d'] = true;
            keys['s'] = true;
            handleMovement(player, { speed: 0.4 });
            expect(player.y).toBe(5.8);
            expect(player.x).toBeGreaterThan(3);
        });

        it('player slides along a wall (horizontal move when vertical blocked)', () => {
            isSolid.mockImplementation((x, y) => x >= 6);
            const player = createPlayer(5.8, 3);
            keys['d'] = true;
            handleMovement(player, { speed: 0.4 });
            expect(player.x).toBe(5.8);
            expect(player.y).toBe(3);
        });

        it('movement speed does not skip over adjacent solid tiles', () => {
            isSolid.mockImplementation((x, y) => Math.floor(y) === 6);
            const player = createPlayer(3, 5.9);
            keys['s'] = true;
            handleMovement(player, { speed: 0.4 });
            expect(player.y).toBeLessThan(6);
        });
    });
});
