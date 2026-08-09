// engine/props.ts
// Prop collision tile generation from prop definitions.

import type { Prop, PropCollisionTile } from './types.js';

export function generatePropCollisionTiles(props: Prop[]): PropCollisionTile[] {
    const tiles: PropCollisionTile[] = [];

    for (const prop of props) {
        if (prop.visible === false) continue;

        if (prop.solidTiles && prop.solidTiles.length > 0) {
            for (const solid of prop.solidTiles) {
                tiles.push({ x: prop.x + solid.dx, y: prop.y + solid.dy });
            }
        } else if (prop.collidable === true) {
            tiles.push({ x: prop.x, y: prop.y });
        }
    }

    return tiles;
}
