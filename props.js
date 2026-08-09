// engine/props.js
// Prop collision tile generation from prop definitions.

/**
 * Generate flat collision tile array from prop definitions.
 * Supports two collision schemes:
 *   - solidTiles: array of {dx, dy} offsets from prop origin (for complex shapes)
 *   - collidable: boolean flag (for simple single-tile props)
 *
 * @param {Array} props - Array of prop definitions
 * @returns {Array<{x: number, y: number}>} Flat array of collision tile positions
 */
export function generatePropCollisionTiles(props) {
    const tiles = [];

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
