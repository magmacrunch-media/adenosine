import { describe, it, expect, vi } from 'vitest';
import { createInteractionManager } from './interactions.js';
import { engine } from './events.js';

describe('createInteractionManager', () => {
    describe('register', () => {
        it('registers interaction source', () => {
            const mgr = createInteractionManager();
            mgr.register({ name: 'items', priority: 10, handler: () => false });
            expect(mgr.getSources()).toHaveLength(1);
        });

        it('sorts sources by priority (highest first)', () => {
            const mgr = createInteractionManager();
            mgr.register({ name: 'low', priority: 1, handler: () => false });
            mgr.register({ name: 'high', priority: 100, handler: () => false });
            expect(mgr.getSources()[0].name).toBe('high');
        });

        it('unregisters source by name', () => {
            const mgr = createInteractionManager();
            mgr.register({ name: 'items', priority: 10, handler: () => false });
            mgr.register({ name: 'npcs', priority: 5, handler: () => false });
            mgr.unregister('items');
            expect(mgr.getSources()).toHaveLength(1);
            expect(mgr.getSources()[0].name).toBe('npcs');
        });
    });

    describe('handleInteraction', () => {
        it('calls highest priority handler first', () => {
            const mgr = createInteractionManager();
            const fn1 = vi.fn(() => false);
            const fn2 = vi.fn(() => true);
            mgr.register({ name: 'low', priority: 1, handler: fn1 });
            mgr.register({ name: 'high', priority: 10, handler: fn2 });
            const result = mgr.handleInteraction({});
            expect(fn2).toHaveBeenCalled();
            expect(fn1).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('falls through to lower priority if not handled', () => {
            const mgr = createInteractionManager();
            const fn1 = vi.fn(() => false);
            const fn2 = vi.fn(() => true);
            mgr.register({ name: 'high', priority: 10, handler: fn1 });
            mgr.register({ name: 'low', priority: 1, handler: fn2 });
            mgr.handleInteraction({});
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('returns false when no source handles it', () => {
            const mgr = createInteractionManager();
            mgr.register({ name: 'items', priority: 10, handler: () => false });
            expect(mgr.handleInteraction({})).toBe(false);
        });

        it('emits interaction-handled when a source handles it', () => {
            const mgr = createInteractionManager();
            const fn = vi.fn();
            engine.on('interaction-handled', fn);
            mgr.register({ name: 'items', priority: 10, handler: () => true });
            mgr.handleInteraction({});
            expect(fn).toHaveBeenCalled();
            engine.off('interaction-handled', fn);
        });

        it('passes player and context to handler', () => {
            const mgr = createInteractionManager();
            const handler = vi.fn(() => true);
            mgr.register({ name: 'items', priority: 10, handler });
            const player = { x: 5, y: 5 };
            const context = { map: 'forest' };
            mgr.handleInteraction(player, context);
            expect(handler).toHaveBeenCalledWith(player, context);
        });
    });

    describe('updatePrompt', () => {
        it('shows prompt from highest priority source', () => {
            const mgr = createInteractionManager();
            mgr.register({ name: 'low', priority: 1, handler: () => false, promptFn: () => 'Low prompt' });
            mgr.register({ name: 'high', priority: 10, handler: () => false, promptFn: () => 'High prompt' });
            mgr.updatePrompt({});
            expect(mgr.getPrompt()).toBe('High prompt');
        });

        it('hides prompt when no source provides one', () => {
            const mgr = createInteractionManager();
            mgr.register({ name: 'items', priority: 10, handler: () => false, promptFn: () => null });
            mgr.updatePrompt({});
            expect(mgr.getPrompt()).toBeNull();
        });

        it('emits prompt-show when prompt changes', () => {
            const mgr = createInteractionManager();
            const fn = vi.fn();
            engine.on('prompt-show', fn);
            mgr.register({ name: 'items', priority: 10, handler: () => false, promptFn: () => 'Press SPACE' });
            mgr.updatePrompt({});
            expect(fn).toHaveBeenCalled();
            engine.off('prompt-show', fn);
        });

        it('emits prompt-hide when prompt clears', () => {
            const mgr = createInteractionManager();
            const fn = vi.fn();
            engine.on('prompt-hide', fn);
            mgr.register({ name: 'items', priority: 10, handler: () => false, promptFn: () => 'Press SPACE' });
            mgr.updatePrompt({});
            mgr.unregister('items');
            mgr.register({ name: 'items', priority: 10, handler: () => false, promptFn: () => null });
            mgr.updatePrompt({});
            expect(fn).toHaveBeenCalled();
            engine.off('prompt-hide', fn);
        });

        it('does not re-emit if prompt unchanged', () => {
            const mgr = createInteractionManager();
            const fn = vi.fn();
            engine.on('prompt-show', fn);
            mgr.register({ name: 'items', priority: 10, handler: () => false, promptFn: () => 'Press SPACE' });
            mgr.updatePrompt({});
            mgr.updatePrompt({});
            expect(fn).toHaveBeenCalledTimes(1);
            engine.off('prompt-show', fn);
        });
    });
});
