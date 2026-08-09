import { describe, it, expect } from 'vitest';
import { createInventory } from './inventory.js';

describe('createInventory', () => {
    it('creates inventory with empty hands and no backpack', () => {
        const inv = createInventory();
        expect(inv.leftHand).toBeNull();
        expect(inv.rightHand).toBeNull();
        expect(inv.backpack).toBeNull();
        expect(inv.storage).toEqual([]);
    });

    describe('addItem', () => {
        it('adds item to left hand when empty', () => {
            const inv = createInventory();
            const item = { type: { id: 'sword' } };
            expect(inv.addItem(item)).toBe(true);
            expect(inv.leftHand).toBe(item);
        });

        it('adds item to right hand when left is occupied', () => {
            const inv = createInventory();
            const item1 = { type: { id: 'sword' } };
            const item2 = { type: { id: 'shield' } };
            inv.addItem(item1);
            expect(inv.addItem(item2)).toBe(true);
            expect(inv.rightHand).toBe(item2);
        });

        it('returns false when both hands are full', () => {
            const inv = createInventory();
            inv.addItem({ type: { id: 'sword' } });
            inv.addItem({ type: { id: 'shield' } });
            expect(inv.addItem({ type: { id: 'potion' } })).toBe(false);
        });
    });

    describe('removeItem', () => {
        it('removes item from left hand by id', () => {
            const inv = createInventory();
            const item = { type: { id: 'sword' } };
            inv.addItem(item);
            const removed = inv.removeItem('sword');
            expect(removed).toBe(item);
            expect(inv.leftHand).toBeNull();
        });

        it('removes item from right hand by id', () => {
            const inv = createInventory();
            const item = { type: { id: 'shield' } };
            inv.addItem(item);
            const removed = inv.removeItem('shield');
            expect(removed).toBe(item);
            expect(inv.rightHand).toBeNull();
        });

        it('returns null when item not found', () => {
            const inv = createInventory();
            expect(inv.removeItem('nonexistent')).toBeNull();
        });
    });

    describe('hasItem', () => {
        it('returns true when item is in left hand', () => {
            const inv = createInventory();
            inv.addItem({ type: { id: 'sword' } });
            expect(inv.hasItem('sword')).toBe(true);
        });

        it('returns true when item is in right hand', () => {
            const inv = createInventory();
            inv.addItem({ type: { id: 'shield' } });
            expect(inv.hasItem('shield')).toBe(true);
        });

        it('returns false when item is not equipped', () => {
            const inv = createInventory();
            expect(inv.hasItem('sword')).toBe(false);
        });
    });

    describe('swapHands', () => {
        it('swaps left and right hand items', () => {
            const inv = createInventory();
            const sword = { type: { id: 'sword' } };
            const shield = { type: { id: 'shield' } };
            inv.addItem(sword);
            inv.addItem(shield);
            inv.swapHands();
            expect(inv.leftHand).toBe(shield);
            expect(inv.rightHand).toBe(sword);
        });

        it('works with one hand empty', () => {
            const inv = createInventory();
            const sword = { type: { id: 'sword' } };
            inv.addItem(sword);
            inv.swapHands();
            expect(inv.leftHand).toBeNull();
            expect(inv.rightHand).toBe(sword);
        });
    });

    describe('isFull', () => {
        it('returns false when empty', () => {
            const inv = createInventory();
            expect(inv.isFull()).toBe(false);
        });

        it('returns false with one item', () => {
            const inv = createInventory();
            inv.addItem({ type: { id: 'sword' } });
            expect(inv.isFull()).toBe(false);
        });

        it('returns true with two items', () => {
            const inv = createInventory();
            inv.addItem({ type: { id: 'sword' } });
            inv.addItem({ type: { id: 'shield' } });
            expect(inv.isFull()).toBe(true);
        });
    });

    describe('backpack', () => {
        it('equips backpack and initializes empty storage', () => {
            const inv = createInventory();
            inv.equipBackpack({ id: 'leather' });
            expect(inv.backpack).toEqual({ id: 'leather' });
            expect(inv.storage).toEqual([]);
        });

        it('unequips backpack and returns it', () => {
            const inv = createInventory();
            const bp = { id: 'leather' };
            inv.equipBackpack(bp);
            const removed = inv.unequipBackpack();
            expect(removed).toBe(bp);
            expect(inv.backpack).toBeNull();
            expect(inv.storage).toEqual([]);
        });

        it('addToStorage adds item when backpack equipped', () => {
            const inv = createInventory();
            inv.equipBackpack({ id: 'leather' });
            expect(inv.addToStorage('potion')).toBe(true);
            expect(inv.storage).toEqual(['potion']);
        });

        it('addToStorage returns false without backpack', () => {
            const inv = createInventory();
            expect(inv.addToStorage('potion')).toBe(false);
        });

        it('addToStorage returns false when storage full (6 items)', () => {
            const inv = createInventory();
            inv.equipBackpack({ id: 'leather' });
            for (let i = 0; i < 6; i++) {
                inv.addToStorage(`item${i}`);
            }
            expect(inv.addToStorage('extra')).toBe(false);
            expect(inv.storage.length).toBe(6);
        });

        it('removeFromStorage removes and returns item', () => {
            const inv = createInventory();
            inv.equipBackpack({ id: 'leather' });
            inv.addToStorage('potion');
            inv.addToStorage('key');
            const removed = inv.removeFromStorage('potion');
            expect(removed).toBe('potion');
            expect(inv.storage).toEqual(['key']);
        });

        it('removeFromStorage returns null when not found', () => {
            const inv = createInventory();
            inv.equipBackpack({ id: 'leather' });
            expect(inv.removeFromStorage('nonexistent')).toBeNull();
        });
    });

    describe('clear', () => {
        it('resets all inventory state', () => {
            const inv = createInventory();
            inv.addItem({ type: { id: 'sword' } });
            inv.addItem({ type: { id: 'shield' } });
            inv.equipBackpack({ id: 'leather' });
            inv.addToStorage('potion');
            inv.clear();
            expect(inv.leftHand).toBeNull();
            expect(inv.rightHand).toBeNull();
            expect(inv.backpack).toBeNull();
            expect(inv.storage).toEqual([]);
        });
    });
});
