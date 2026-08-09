// engine/entities.ts
// NPC and enemy entity management with patrol AI.

import { engine } from './events.js';
import type { NPC, Enemy, AddNPCData, AddEnemyData, EntityManager, Player } from './types.js';

export function createEntityManager(): EntityManager {
    const npcs: NPC[] = [];
    const enemies: Enemy[] = [];

    return {
        addNPC(data: AddNPCData): NPC {
            const npc: NPC = {
                x: data.x,
                y: data.y,
                width: data.width ?? 1,
                height: data.height ?? 1,
                name: data.name || '',
                type: data.type || 'npc',
                map: data.map || 'default',
                direction: data.direction || 'down',
                dialogue: data.dialogue || [],
            };
            npcs.push(npc);
            return npc;
        },

        addEnemy(data: AddEnemyData): Enemy {
            const enemy: Enemy = {
                x: data.x,
                y: data.y,
                width: data.width ?? 1,
                height: data.height ?? 1,
                map: data.map || 'default',
                type: data.type || 'enemy',
                direction: data.direction ?? 1,
                moveCounter: 0,
                moveSpeed: data.moveSpeed ?? 60,
                patrolRange: data.patrolRange ?? 5,
                startX: data.x,
                startY: data.y,
                damage: data.damage ?? 10,
            };
            enemies.push(enemy);
            return enemy;
        },

        getNPCs(mapName?: string): NPC[] {
            return mapName ? npcs.filter(n => n.map === mapName) : [...npcs];
        },

        getEnemies(mapName?: string): Enemy[] {
            return mapName ? enemies.filter(e => e.map === mapName) : [...enemies];
        },

        updateEnemies(mapName: string, isSolidFn: (x: number, y: number) => boolean, dt: number = 1): void {
            for (const enemy of enemies) {
                if (enemy.map !== mapName) continue;
                enemy.moveCounter += dt;
                if (enemy.moveCounter >= enemy.moveSpeed) {
                    enemy.moveCounter = 0;
                    const nextX = enemy.x + enemy.direction;
                    if (!isSolidFn(nextX, enemy.y) && Math.abs(nextX - enemy.startX) <= enemy.patrolRange) {
                        enemy.x = nextX;
                    } else {
                        enemy.direction *= -1;
                    }
                }
            }
        },

        checkEnemyCollisions(playerX: number, playerY: number, mapName: string, damageCallback: (damage: number) => void): Enemy | null {
            for (const enemy of enemies) {
                if (enemy.map !== mapName) continue;
                const dx = Math.abs(playerX - enemy.x);
                const dy = Math.abs(playerY - enemy.y);
                if (dx < 1 && dy < 1) {
                    damageCallback(enemy.damage);
                    engine.emit('enemy-collision', { enemy });
                    return enemy;
                }
            }
            return null;
        },

        getNPCInFront(player: Player, mapName: string, threshold: number = 0.8): NPC | null {
            const targetX = player.x + player.facingX;
            const targetY = player.y + player.facingY;
            for (const npc of npcs) {
                if (npc.map !== mapName) continue;
                const dx = npc.x - targetX;
                const dy = npc.y - targetY;
                if ((dx * dx + dy * dy) < threshold) {
                    return npc;
                }
            }
            return null;
        },
    };
}
