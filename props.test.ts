import { describe, it, expect } from 'vitest';
import { generatePropCollisionTiles } from './props.js';

describe('generatePropCollisionTiles', () => {
    it('generates tiles from solidTiles offsets', () => {
        const props = [
            { x: 5, y: 5, solidTiles: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }] },
        ];
        const tiles = generatePropCollisionTiles(props);
        expect(tiles).toEqual([{ x: 5, y: 5 }, { x: 6, y: 5 }]);
    });

    it('generates tile from collidable flag', () => {
        const props = [
            { x: 5, y: 5, collidable: true },
        ];
        const tiles = generatePropCollisionTiles(props);
        expect(tiles).toEqual([{ x: 5, y: 5 }]);
    });

    it('skips props with visible === false', () => {
        const props = [
            { x: 5, y: 5, collidable: true, visible: false },
            { x: 10, y: 10, collidable: true },
        ];
        const tiles = generatePropCollisionTiles(props);
        expect(tiles).toEqual([{ x: 10, y: 10 }]);
    });

    it('skips non-collidable props', () => {
        const props = [
            { x: 5, y: 5, type: 'decoration' },
        ];
        const tiles = generatePropCollisionTiles(props);
        expect(tiles).toEqual([]);
    });

    it('returns empty array for empty input', () => {
        expect(generatePropCollisionTiles([])).toEqual([]);
    });

    it('handles multiple props with mixed collision schemes', () => {
        const props = [
            { x: 0, y: 0, solidTiles: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }] },
            { x: 10, y: 10, collidable: true },
            { x: 20, y: 20, type: 'decoration' },
            { x: 30, y: 30, collidable: true, visible: false },
        ];
        const tiles = generatePropCollisionTiles(props);
        expect(tiles).toEqual([
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 },
            { x: 10, y: 10 },
        ]);
    });

    it('prefers solidTiles over collidable when both present', () => {
        const props = [
            { x: 5, y: 5, solidTiles: [{ dx: 0, dy: 0 }], collidable: true },
        ];
        const tiles = generatePropCollisionTiles(props);
        expect(tiles).toEqual([{ x: 5, y: 5 }]);
    });
});
