// engine/detection.ts
// Entity and prop detection helpers for interaction systems.

import type { Player, Entity } from './types.js';

interface DetectableEntity {
    x: number;
    y: number;
    width?: number;
    height?: number;
    map?: string;
    [key: string]: unknown;
}

export function getEntityInFront(player: Player, entities: DetectableEntity[], opts: { map?: string; threshold?: number; filter?: (entity: DetectableEntity) => boolean } = {}): DetectableEntity | null {
    const { map, threshold = 0.8, filter } = opts;
    const targetX = player.x + player.facingX;
    const targetY = player.y + player.facingY;

    for (const entity of entities) {
        if (map && entity.map !== map) continue;
        if (filter && !filter(entity)) continue;

        const dx = entity.x - targetX;
        const dy = entity.y - targetY;
        if ((dx * dx + dy * dy) < threshold) {
            return entity;
        }
    }
    return null;
}

interface DetectableProp {
    x: number;
    y: number;
    width?: number;
    height?: number;
}

export function isFacingProp(player: Player, prop: DetectableProp): boolean {
    const facingX = Math.floor(player.x + player.facingX);
    const facingY = Math.floor(player.y + player.facingY);

    if (prop.width && prop.height) {
        for (let dy = 0; dy < prop.height; dy++) {
            for (let dx = 0; dx < prop.width; dx++) {
                if (facingX === prop.x + dx && facingY === prop.y + dy) {
                    return true;
                }
            }
        }
        return false;
    }

    return facingX === prop.x && facingY === prop.y;
}

export function isNearProp(player: Player, prop: DetectableProp, threshold: number = 2.0): boolean {
    if (prop.width && prop.height) {
        for (let dy = 0; dy < prop.height; dy++) {
            for (let dx = 0; dx < prop.width; dx++) {
                const distance = Math.abs(player.x - (prop.x + dx)) + Math.abs(player.y - (prop.y + dy));
                if (distance < threshold) return true;
            }
        }
        return false;
    }

    const distance = Math.abs(player.x - prop.x) + Math.abs(player.y - prop.y);
    return distance < threshold;
}
