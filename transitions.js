// engine/transitions.js
// Map transition system — enter/exit interiors with position locking.

import { player, currentMap, setCurrentMap, setMap, transitionCooldown, setTransitionCooldown, canvas } from './state.js';
import { camera } from './camera.js';
import { engine } from './events.js';

function lockPosition(facing, tileSize = 16) {
    player.positionLocked = true;
    if (facing) {
        player.direction = facing;
        if (facing === 'up') { player.facingX = 0; player.facingY = -1; }
        else if (facing === 'down') { player.facingX = 0; player.facingY = 1; }
        else if (facing === 'left') { player.facingX = -1; player.facingY = 0; }
        else if (facing === 'right') { player.facingX = 1; player.facingY = 0; }
    }
    if (canvas) {
        camera.x = player.x * tileSize - canvas.width / 2;
        camera.y = player.y * tileSize - canvas.height / 2;
    }
    setTimeout(() => { player.positionLocked = false; }, 1);
}

/**
 * Transition to a different map.
 * @param {object} opts
 * @param {string} opts.mapName - Map key
 * @param {object} opts.maps - Maps registry { mapName: mapData }
 * @param {number} opts.x - Spawn X
 * @param {number} opts.y - Spawn Y
 * @param {string} [opts.facing] - Player facing direction
 * @param {number} [opts.tileSize=16] - Tile size for camera snap
 */
export function transitionTo({ mapName, maps, x, y, facing, tileSize = 16 }) {
    setTransitionCooldown(30);
    setCurrentMap(mapName);
    setMap(maps[mapName]);
    player.x = x;
    player.y = y;
    lockPosition(facing, tileSize);
    engine.emit('map-changed', { mapName, map: maps[mapName] });
}
