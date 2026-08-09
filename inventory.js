// engine/inventory.js
// Two-hand inventory system with backpack storage.

import { engine } from './events.js';

export function createInventory() {
    return {
        leftHand: null,
        rightHand: null,
        backpack: null,
        storage: [],
        _storageCapacity: 6,

        addItem(item) {
            if (this.leftHand === null) { this.leftHand = item; engine.emit('item-acquired', item); return true; }
            if (this.rightHand === null) { this.rightHand = item; engine.emit('item-acquired', item); return true; }
            return false;
        },

        removeItem(itemId) {
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

        getItem(itemId) {
            if (this.leftHand?.type.id === itemId) return this.leftHand;
            if (this.rightHand?.type.id === itemId) return this.rightHand;
            return null;
        },

        hasItem(itemId) {
            return (this.leftHand?.type.id === itemId) || (this.rightHand?.type.id === itemId);
        },

        swapHands() {
            const temp = this.leftHand;
            this.leftHand = this.rightHand;
            this.rightHand = temp;
        },

        isFull() {
            return this.leftHand !== null && this.rightHand !== null;
        },

        equipBackpack(type) {
            this.backpack = type;
            this.storage = [];
            this._storageCapacity = type?.storageCapacity || 6;
        },

        unequipBackpack() {
            const bp = this.backpack;
            this.backpack = null;
            this.storage = [];
            this._storageCapacity = 6;
            return bp;
        },

        addToStorage(itemId) {
            if (!this.backpack || this.storage.length >= this._storageCapacity) return false;
            this.storage.push(itemId);
            return true;
        },

        removeFromStorage(itemId) {
            const idx = this.storage.indexOf(itemId);
            if (idx === -1) return null;
            this.storage.splice(idx, 1);
            return itemId;
        },

        clear() {
            this.leftHand = null;
            this.rightHand = null;
            this.backpack = null;
            this.storage = [];
            this._storageCapacity = 6;
        },
    };
}
