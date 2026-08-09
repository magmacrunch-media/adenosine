// engine/transitions.ts
// Map transition system — enter/exit interiors with position locking.

import { player, currentMap, setCurrentMap, setMap, transitionCooldown, setTransitionCooldown, canvas } from './state.js';
import { camera } from './camera.js';
import { engine } from './events.js';
import type { TransitionOpts } from './types.js';

function lockPosition(facing: string | undefined, tileSize: number = 16): void {
    player.positionLocked = true;
    if (facing) {
        player.direction = facing as 'up' | 'down' | 'left' | 'right';
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

export function transitionTo({ mapName, maps, x, y, facing, tileSize = 16 }: TransitionOpts): void {
    setTransitionCooldown(30);
    setCurrentMap(mapName);
    const mapData = maps[mapName] ?? null;
    setMap(mapData);
    player.x = x;
    player.y = y;
    lockPosition(facing, tileSize);
    engine.emit('map-changed', { mapName, map: mapData ?? [] });
}
