import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createItemRegistry, createWorldItems } from './items.js';
import { engine } from './events.js';

describe('createItemRegistry', () => {
    let registry;

    beforeEach(() => {
        registry = createItemRegistry();
    });

    it('registers and retrieves item types', () => {
        registry.register({ id: 'sword', name: 'Iron Sword' });
        expect(registry.get('sword')).toEqual({ id: 'sword', name: 'Iron Sword' });
    });

    it('returns null for unknown items', () => {
        expect(registry.get('nonexistent')).toBeNull();
    });

    it('isQuest returns true for required items', () => {
        registry.register({ id: 'key', required: true });
        expect(registry.isQuest('key')).toBe(true);
    });

    it('isQuest returns false for non-required items', () => {
        registry.register({ id: 'sword', required: false });
        expect(registry.isQuest('sword')).toBe(false);
    });

    it('isQuest returns false for unknown items', () => {
        expect(registry.isQuest('nonexistent')).toBe(false);
    });

    it('canDrop returns true by default', () => {
        registry.register({ id: 'sword' });
        expect(registry.canDrop('sword')).toBe(true);
    });

    it('canDrop returns false when explicitly set', () => {
        registry.register({ id: 'key', canDrop: false });
        expect(registry.canDrop('key')).toBe(false);
    });

    it('canStore returns true by default', () => {
        registry.register({ id: 'sword' });
        expect(registry.canStore('sword')).toBe(true);
    });

    it('canStore returns false when explicitly set', () => {
        registry.register({ id: 'quest-item', canStore: false });
        expect(registry.canStore('quest-item')).toBe(false);
    });

    it('all returns all registered types', () => {
        registry.register({ id: 'sword' });
        registry.register({ id: 'shield' });
        expect(registry.all()).toHaveLength(2);
    });
});

describe('createWorldItems', () => {
    let world;

    beforeEach(() => {
        world = createWorldItems();
    });

    it('addItem places item in world', () => {
        const item = world.addItem('outside', 'sword', 10, 5);
        expect(world.getItems('outside')).toHaveLength(1);
        expect(item.itemId).toBe('sword');
    });

    it('getItems returns empty array for unknown map', () => {
        expect(world.getItems('unknown')).toEqual([]);
    });

    it('checkPickup finds nearby item', () => {
        world.addItem('outside', 'sword', 10, 5);
        const found = world.checkPickup(10.5, 5.5, 'outside');
        expect(found).not.toBeNull();
        expect(found.itemId).toBe('sword');
    });

    it('checkPickup returns null when too far', () => {
        world.addItem('outside', 'sword', 10, 5);
        const found = world.checkPickup(20, 20, 'outside');
        expect(found).toBeNull();
    });

    it('checkPickup respects custom radius', () => {
        world.addItem('outside', 'sword', 10, 5);
        expect(world.checkPickup(11, 5, 'outside', 0.5)).toBeNull();
        expect(world.checkPickup(11, 5, 'outside', 2.0)).not.toBeNull();
    });

    it('pickup adds to inventory and removes from world', () => {
        const item = world.addItem('outside', 'sword', 10, 5);
        const inventory = { addItem: vi.fn(() => true) };
        const result = world.pickup(item, inventory);
        expect(result).toBe(true);
        expect(inventory.addItem).toHaveBeenCalled();
        expect(world.getItems('outside')).toHaveLength(0);
    });

    it('pickup returns false when inventory full', () => {
        const item = world.addItem('outside', 'sword', 10, 5);
        const inventory = { addItem: vi.fn(() => false) };
        const result = world.pickup(item, inventory);
        expect(result).toBe(false);
        expect(world.getItems('outside')).toHaveLength(1);
    });

    it('remove removes specific item', () => {
        const item = world.addItem('outside', 'sword', 10, 5);
        world.addItem('outside', 'shield', 11, 5);
        expect(world.remove(item)).toBe(true);
        expect(world.getItems('outside')).toHaveLength(1);
    });

    it('remove returns false for unknown item', () => {
        expect(world.remove({ itemId: 'ghost' })).toBe(false);
    });

    it('clear removes all items for a map', () => {
        world.addItem('outside', 'sword', 10, 5);
        world.addItem('outside', 'shield', 11, 5);
        world.clear('outside');
        expect(world.getItems('outside')).toHaveLength(0);
    });
});
