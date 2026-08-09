// engine/inventory.ts
// Two-hand inventory system with backpack storage.

import { engine } from './events.js';
import type { Inventory, Item, BackpackType } from './types.js';

export function createInventory(): Inventory {
    return {
        leftHand: null,
        rightHand: null,
        backpack: null,
        storage: [],

        addItem(item: Item): boolean {
            if (this.leftHand === null) { this.leftHand = item; engine.emit('item-acquired', item); return true; }
            if (this.rightHand === null) { this.rightHand = item; engine.emit('item-acquired', item); return true; }
            return false;
        },

        removeItem(itemId: string): Item | null {
            if (this.leftHand && this.leftHand.type.id === itemId) {
                const removed = this.leftHand;
                this.leftHand = null;
                engine.emit('item-removed', removed);
                return removed;
            }
            if (this.rightHand && this.rightHand.type.id === itemId) {
                const removed = this.rightHand;
                this.rightHand = null;
                engine.emit('item-removed', removed);
                return removed;
            }
            return null;
        },

        getItem(itemId: string): Item | null {
            if (this.leftHand?.type.id === itemId) return this.leftHand;
            if (this.rightHand?.type.id === itemId) return this.rightHand;
            return null;
        },

        hasItem(itemId: string): boolean {
            return (this.leftHand?.type.id === itemId) || (this.rightHand?.type.id === itemId);
        },

        swapHands(): void {
            const temp = this.leftHand;
            this.leftHand = this.rightHand;
            this.rightHand = temp;
        },

        isFull(): boolean {
            return this.leftHand !== null && this.rightHand !== null;
        },

        equipBackpack(type: BackpackType): void {
            this.backpack = type;
            this.storage = [];
        },

        unequipBackpack(): BackpackType | null {
            const bp = this.backpack;
            this.backpack = null;
            this.storage = [];
            return bp;
        },

        addToStorage(itemId: string): boolean {
            if (!this.backpack) return false;
            const capacity = this.backpack.storageCapacity ?? 6;
            if (this.storage.length >= capacity) return false;
            this.storage.push(itemId);
            return true;
        },

        removeFromStorage(itemId: string): string | null {
            const idx = this.storage.indexOf(itemId);
            if (idx === -1) return null;
            this.storage.splice(idx, 1);
            return itemId;
        },

        clear(): void {
            this.leftHand = null;
            this.rightHand = null;
            this.backpack = null;
            this.storage = [];
        },
    };
}
