import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keys } from './input.js';
import { DEFAULT_BINDINGS } from './bindings.js';
import { handleMovement } from './movement.js';

vi.mock('./input.js', () => ({
    keys: {},
}));

vi.mock('./collision.js', () => ({
    isSolid: vi.fn(() => false),
}));

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
});

describe('DEFAULT_BINDINGS', () => {
    it('has all required binding groups', () => {
        expect(DEFAULT_BINDINGS.moveUp).toBeDefined();
        expect(DEFAULT_BINDINGS.moveDown).toBeDefined();
        expect(DEFAULT_BINDINGS.moveLeft).toBeDefined();
        expect(DEFAULT_BINDINGS.moveRight).toBeDefined();
        expect(DEFAULT_BINDINGS.pause).toBeDefined();
        expect(DEFAULT_BINDINGS.interact).toBeDefined();
    });

    it('has arrow and WASD keys for movement', () => {
        expect(DEFAULT_BINDINGS.moveUp).toContain('arrowup');
        expect(DEFAULT_BINDINGS.moveUp).toContain('w');
        expect(DEFAULT_BINDINGS.moveDown).toContain('arrowdown');
        expect(DEFAULT_BINDINGS.moveDown).toContain('s');
        expect(DEFAULT_BINDINGS.moveLeft).toContain('arrowleft');
        expect(DEFAULT_BINDINGS.moveLeft).toContain('a');
        expect(DEFAULT_BINDINGS.moveRight).toContain('arrowright');
        expect(DEFAULT_BINDINGS.moveRight).toContain('d');
    });
});

describe('custom bindings', () => {
    it('moves up with custom binding', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveUp: ['i'],
        };
        const player = createPlayer(5, 5);
        keys['i'] = true;
        handleMovement(player, { speed: 1, bindings });
        expect(player.y).toBeLessThan(5);
        expect(player.direction).toBe('up');
    });

    it('moves down with custom binding', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveDown: ['k'],
        };
        const player = createPlayer(5, 5);
        keys['k'] = true;
        handleMovement(player, { speed: 1, bindings });
        expect(player.y).toBeGreaterThan(5);
        expect(player.direction).toBe('down');
    });

    it('moves left with custom binding', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveLeft: ['j'],
        };
        const player = createPlayer(5, 5);
        keys['j'] = true;
        handleMovement(player, { speed: 1, bindings });
        expect(player.x).toBeLessThan(5);
        expect(player.direction).toBe('left');
    });

    it('moves right with custom binding', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveRight: ['l'],
        };
        const player = createPlayer(5, 5);
        keys['l'] = true;
        handleMovement(player, { speed: 1, bindings });
        expect(player.x).toBeGreaterThan(5);
        expect(player.direction).toBe('right');
    });

    it('default WASD bindings still work', () => {
        const player = createPlayer(5, 5);
        keys['w'] = true;
        handleMovement(player, { speed: 1 });
        expect(player.y).toBeLessThan(5);
    });

    it('ignores old keys when bindings are overridden', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveUp: ['i'],
        };
        const player = createPlayer(5, 5);
        keys['w'] = true;
        handleMovement(player, { speed: 1, bindings });
        expect(player.y).toBe(5);
    });

    it('supports multiple keys per direction', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveUp: ['i', 'pageup'],
        };
        const player1 = createPlayer(5, 5);
        keys['i'] = true;
        handleMovement(player1, { speed: 1, bindings });
        expect(player1.y).toBeLessThan(5);

        const player2 = createPlayer(5, 5);
        keys['pageup'] = true;
        handleMovement(player2, { speed: 1, bindings });
        expect(player2.y).toBeLessThan(5);
    });

    it('diagonal movement with custom bindings', () => {
        const bindings = {
            ...DEFAULT_BINDINGS,
            moveUp: ['i'],
            moveRight: ['l'],
        };
        const player = createPlayer(5, 5);
        keys['i'] = true;
        keys['l'] = true;
        handleMovement(player, { speed: 1, bindings });
        expect(player.x).toBeGreaterThan(5);
        expect(player.y).toBeLessThan(5);
    });
});
