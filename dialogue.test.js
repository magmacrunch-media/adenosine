import { describe, it, expect, vi } from 'vitest';
import { createDialogueSystem } from './dialogue.js';
import { engine } from './events.js';

describe('createDialogueSystem', () => {
    describe('show', () => {
        it('activates dialogue with speaker', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Hello!'] });
            expect(d.isActive()).toBe(true);
        });

        it('sets initial line', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Line 1', 'Line 2'] });
            expect(d.getState().currentLine).toBe('Line 1');
        });

        it('handles single string dialogue', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: 'Hello!' });
            expect(d.getState().currentLine).toBe('Hello!');
        });

        it('emits dialogue-start event', () => {
            const d = createDialogueSystem();
            const fn = vi.fn();
            engine.on('dialogue-start', fn);
            d.show({ name: 'Wizard', dialogue: ['Hello!'] });
            expect(fn).toHaveBeenCalled();
            engine.off('dialogue-start', fn);
        });
    });

    describe('advance', () => {
        it('moves to next line', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Line 1', 'Line 2'] });
            d.advance();
            expect(d.getState().currentLine).toBe('Line 2');
        });

        it('closes when all lines shown (no choices)', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Hello'] });
            d.advance();
            expect(d.isActive()).toBe(false);
        });

        it('emits dialogue-line on advance', () => {
            const d = createDialogueSystem();
            const fn = vi.fn();
            engine.on('dialogue-line', fn);
            d.show({ name: 'Wizard', dialogue: ['Line 1', 'Line 2'] });
            d.advance();
            expect(fn).toHaveBeenCalled();
            engine.off('dialogue-line', fn);
        });

        it('does nothing when not active', () => {
            const d = createDialogueSystem();
            expect(() => d.advance()).not.toThrow();
        });
    });

    describe('choices', () => {
        it('shows choices after last line', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Choose?'] }, {
                choices: [{ label: 'Yes' }, { label: 'No' }],
            });
            d.advance();
            expect(d.getState().showChoices).toBe(true);
        });

        it('selectChoice closes dialogue and calls callback', () => {
            const cb = vi.fn();
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Choose?'] }, {
                choices: [{ label: 'Yes', callback: cb }],
            });
            d.advance();
            d.selectChoice();
            expect(cb).toHaveBeenCalledOnce();
            expect(d.isActive()).toBe(false);
        });

        it('moveChoice changes selection', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Choose?'] }, {
                choices: [{ label: 'Yes' }, { label: 'No' }, { label: 'Maybe' }],
            });
            d.advance();
            d.moveChoice(1);
            expect(d.getState().choiceIndex).toBe(1);
            d.moveChoice(1);
            expect(d.getState().choiceIndex).toBe(2);
            d.moveChoice(1);
            expect(d.getState().choiceIndex).toBe(0);
        });

        it('moveChoice wraps around', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Choose?'] }, {
                choices: [{ label: 'Yes' }, { label: 'No' }],
            });
            d.advance();
            d.moveChoice(-1);
            expect(d.getState().choiceIndex).toBe(1);
        });

        it('advance does not close when choices are shown', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Choose?'] }, {
                choices: [{ label: 'Yes' }, { label: 'No' }],
            });
            d.advance();
            d.advance();
            expect(d.isActive()).toBe(true);
        });
    });

    describe('close', () => {
        it('deactivates dialogue', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Hello'] });
            d.close();
            expect(d.isActive()).toBe(false);
        });

        it('calls onClose callback', () => {
            const cb = vi.fn();
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Hello'] }, { onClose: cb });
            d.close();
            expect(cb).toHaveBeenCalledOnce();
        });

        it('emits dialogue-close event', () => {
            const d = createDialogueSystem();
            const fn = vi.fn();
            engine.on('dialogue-close', fn);
            d.show({ name: 'Wizard', dialogue: ['Hello'] });
            d.close();
            expect(fn).toHaveBeenCalledOnce();
            engine.off('dialogue-close', fn);
        });

        it('resets state after close', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Hello'] });
            d.close();
            expect(d.getState().speaker).toBeNull();
            expect(d.getState().lines).toEqual([]);
        });

        it('does nothing when not active', () => {
            const d = createDialogueSystem();
            const cb = vi.fn();
            d.show({ name: 'Wizard', dialogue: ['Hello'] }, { onClose: cb });
            d.close();
            cb.mockClear();
            d.close();
            expect(cb).not.toHaveBeenCalled();
        });
    });

    describe('getState', () => {
        it('returns complete state', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Line 1', 'Line 2'] });
            const state = d.getState();
            expect(state.active).toBe(true);
            expect(state.speaker.name).toBe('Wizard');
            expect(state.lines).toEqual(['Line 1', 'Line 2']);
            expect(state.lineIndex).toBe(0);
            expect(state.hasMoreLines).toBe(true);
        });

        it('hasMoreLines is false on last line', () => {
            const d = createDialogueSystem();
            d.show({ name: 'Wizard', dialogue: ['Only line'] });
            expect(d.getState().hasMoreLines).toBe(false);
        });
    });
});
