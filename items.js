// engine/items.js
// Item type registry and world item management.

import { engine } from './events.js';

/**
 * Create an item type registry.
 * @returns {{ register: Function, get: Function, isQuest: Function, canDrop: Function, canStore: Function, all: Function }}
 */
export function createItemRegistry() {
    const types = new Map();

    return {
        register(typeDef) {
            types.set(typeDef.id, typeDef);
        },
        get(id) {
            return types.get(id) || null;
        },
        isQuest(id) {
            return types.get(id)?.required === true;
        },
        canDrop(id) {
            return types.get(id)?.canDrop !== false;
        },
        canStore(id) {
            return types.get(id)?.canStore !== false;
        },
        all() {
            return [...types.values()];
        },
    };
}

/**
 * Create a world item manager for tracking items on the ground.
 * @returns {{ addItem: Function, getItems: Function, checkPickup: Function, pickup: Function, remove: Function, clear: Function }}
 */
export function createWorldItems() {
    const items = new Map();

    return {
        addItem(mapName, itemId, x, y) {
            if (!items.has(mapName)) items.set(mapName, []);
            const item = { itemId, x, y };
            items.get(mapName).push(item);
            engine.emit('world-item-added', { mapName, item });
            return item;
        },
        getItems(mapName) {
            return items.get(mapName) || [];
        },
        checkPickup(playerX, playerY, mapName, radius = 1.5) {
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
        pickup(item, inventory) {
            const added = inventory.addItem({ type: { id: item.itemId } });
            if (added) {
                this.remove(item);
                engine.emit('world-item-picked', { item });
                return true;
            }
            return false;
        },
        remove(item) {
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
        clear(mapName) {
            items.delete(mapName);
        },
    };
}
