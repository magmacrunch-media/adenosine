import { describe, it, expect } from 'vitest';
import { isSolid } from './collision.js';

function createMap(width, height, fill = 0) {
    return Array.from({ length: height }, () => Array(width).fill(fill));
}

describe('isSolid', () => {
    describe('boundary checks', () => {
        it('returns true at left boundary (x < 1)', () => {
            const map = createMap(5, 5);
            expect(isSolid(0, 2, { map, solidTiles: [] })).toBe(true);
        });

        it('returns true at right boundary (x >= width - 1)', () => {
            const map = createMap(5, 5);
            expect(isSolid(4, 2, { map, solidTiles: [] })).toBe(true);
        });

        it('returns true at top boundary (y < 1)', () => {
            const map = createMap(5, 5);
            expect(isSolid(2, 0, { map, solidTiles: [] })).toBe(true);
        });

        it('returns true at bottom boundary (y >= height - 1)', () => {
            const map = createMap(5, 5);
            expect(isSolid(2, 4, { map, solidTiles: [] })).toBe(true);
        });

        it('returns false for interior tile', () => {
            const map = createMap(5, 5);
            expect(isSolid(2, 2, { map, solidTiles: [] })).toBe(false);
        });
    });

    describe('tile collision', () => {
        it('returns true for solid tile ID', () => {
            const map = createMap(5, 5);
            map[2][2] = 5;
            expect(isSolid(2, 2, { map, solidTiles: [5] })).toBe(true);
        });

        it('returns false for non-solid tile ID', () => {
            const map = createMap(5, 5);
            map[2][2] = 3;
            expect(isSolid(2, 2, { map, solidTiles: [5] })).toBe(false);
        });
    });

    describe('entity collision', () => {
        it('returns true when player overlaps entity', () => {
            const map = createMap(5, 5);
            const entities = [{ x: 2, y: 2, width: 1, height: 1 }];
            expect(isSolid(2, 2, { map, solidTiles: [], entities })).toBe(true);
        });

        it('returns false when player is far from entity', () => {
            const map = createMap(5, 5);
            const entities = [{ x: 0, y: 0, width: 1, height: 1 }];
            expect(isSolid(2, 2, { map, solidTiles: [], entities })).toBe(false);
        });

        it('handles entities without explicit width/height (defaults to 1)', () => {
            const map = createMap(5, 5);
            const entities = [{ x: 2, y: 2 }];
            expect(isSolid(2, 2, { map, solidTiles: [], entities })).toBe(true);
        });
    });

    describe('prop collision', () => {
        it('returns true when player is on prop tile', () => {
            const map = createMap(5, 5);
            const props = [{ x: 2, y: 2 }];
            expect(isSolid(2, 2, { map, solidTiles: [], props })).toBe(true);
        });

        it('returns false when player is not on prop tile', () => {
            const map = createMap(5, 5);
            const props = [{ x: 3, y: 3 }];
            expect(isSolid(2, 2, { map, solidTiles: [], props })).toBe(false);
        });
    });

    describe('fractional coordinates', () => {
        it('floors fractional x and y for tile check', () => {
            const map = createMap(5, 5);
            map[2][2] = 5;
            expect(isSolid(2.5, 2.5, { map, solidTiles: [5] })).toBe(true);
        });

        it('handles small epsilon offset', () => {
            const map = createMap(5, 5);
            map[2][2] = 5;
            expect(isSolid(2.001, 2.001, { map, solidTiles: [5] })).toBe(true);
        });
    });
});
