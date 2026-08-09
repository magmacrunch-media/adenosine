// engine/items.ts
// Item type registry and world item management.

import { engine } from './events.js';
import type { ItemTypeDef, ItemRegistry, WorldItem, WorldItems, Inventory } from './types.js';

export function createItemRegistry(): ItemRegistry {
    const types = new Map<string, ItemTypeDef>();

    return {
        register(typeDef: ItemTypeDef): void {
            types.set(typeDef.id, typeDef);
        },
        get(id: string): ItemTypeDef | null {
            return types.get(id) || null;
        },
        isQuest(id: string): boolean {
            return types.get(id)?.required === true;
        },
        canDrop(id: string): boolean {
            return types.get(id)?.canDrop !== false;
        },
        canStore(id: string): boolean {
            return types.get(id)?.canStore !== false;
        },
        all(): ItemTypeDef[] {
            return [...types.values()];
        },
    };
}

export function createWorldItems(): WorldItems {
    const items = new Map<string, WorldItem[]>();

    return {
        addItem(mapName: string, itemId: string, x: number, y: number): WorldItem {
            if (!items.has(mapName)) items.set(mapName, []);
            const item: WorldItem = { itemId, x, y };
            items.get(mapName)!.push(item);
            engine.emit('world-item-added', { mapName, item });
            return item;
        },
        getItems(mapName: string): WorldItem[] {
            return items.get(mapName) || [];
        },
        checkPickup(playerX: number, playerY: number, mapName: string, radius: number = 1.5): WorldItem | null {
            const mapItems = items.get(mapName) || [];
            for (const item of mapItems) {
                const dx = Math.abs(playerX - item.x);
                const dy = Math.abs(playerY - item.y);
                if (dx < radius && dy < radius) {
                    return item;
                }
            }
            return null;
        },
        pickup(item: WorldItem, inventory: Inventory): boolean {
            const added = inventory.addItem({ type: { id: item.itemId } });
            if (added) {
                this.remove(item);
                engine.emit('world-item-picked', { item });
                return true;
            }
            return false;
        },
        remove(item: WorldItem): boolean {
            for (const [mapName, mapItems] of items) {
                const idx = mapItems.indexOf(item);
                if (idx !== -1) {
                    mapItems.splice(idx, 1);
                    engine.emit('world-item-removed', { mapName, item });
                    return true;
                }
            }
            return false;
        },
        clear(mapName?: string): void {
            if (mapName) {
                items.delete(mapName);
            } else {
                items.clear();
            }
        },
    };
}
