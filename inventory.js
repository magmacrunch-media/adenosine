// engine/inventory.js
// Two-hand inventory system with backpack storage.

export function createInventory() {
    return {
        leftHand: null,
        rightHand: null,
        backpack: null,
        storage: [],

        addItem(item) {
            if (this.leftHand === null) { this.leftHand = item; return true; }
            if (this.rightHand === null) { this.rightHand = item; return true; }
            return false;
        },

        removeItem(itemId) {
            if (this.leftHand && this.leftHand.type.id === itemId) {
                const removed = this.leftHand;
                this.leftHand = null;
                return removed;
            }
            if (this.rightHand && this.rightHand.type.id === itemId) {
                const removed = this.rightHand;
                this.rightHand = null;
                return removed;
            }
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
        },

        unequipBackpack() {
            const bp = this.backpack;
            this.backpack = null;
            this.storage = [];
            return bp;
        },

        addToStorage(itemId) {
            if (!this.backpack || this.storage.length >= 6) return false;
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
        },
    };
}
