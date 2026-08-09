/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showNotification } from './notifications.js';

beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('showNotification', () => {
    it('creates a notification element', () => {
        showNotification('Hello World');
        const el = document.body.querySelector('div');
        expect(el).not.toBeNull();
        expect(el.textContent).toBe('Hello World');
    });

    it('appends to document.body by default', () => {
        showNotification('Test');
        expect(document.body.children.length).toBe(1);
    });

    it('appends to custom container', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        showNotification('Test', { container });
        expect(container.children.length).toBe(1);
        expect(document.body.children.length).toBe(1);
    });

    it('removes element after duration', () => {
        showNotification('Gone soon', { duration: 1000 });
        expect(document.body.querySelector('div')).not.toBeNull();
        vi.advanceTimersByTime(1000);
        expect(document.body.querySelector('div')).toBeNull();
    });

    it('uses default duration of 2000ms', () => {
        showNotification('Default');
        vi.advanceTimersByTime(1999);
        expect(document.body.querySelector('div')).not.toBeNull();
        vi.advanceTimersByTime(1);
        expect(document.body.querySelector('div')).toBeNull();
    });

    describe('themes', () => {
        it('applies default theme styling', () => {
            showNotification('Default', { theme: 'default' });
            const el = document.body.querySelector('div');
            expect(el.style.background).toBe('rgb(58, 68, 102)');
            expect(el.style.color).toBe('rgb(255, 255, 255)');
        });

        it('applies locked theme styling', () => {
            showNotification('Locked', { theme: 'locked' });
            const el = document.body.querySelector('div');
            expect(el.style.background).toBe('rgb(90, 74, 42)');
            expect(el.style.color).toBe('rgb(255, 215, 0)');
        });

        it('applies item theme styling', () => {
            showNotification('Item Get', { theme: 'item' });
            const el = document.body.querySelector('div');
            expect(el.style.background).toBe('rgb(42, 74, 42)');
            expect(el.style.color).toBe('rgb(144, 238, 144)');
        });

        it('falls back to default theme for unknown theme', () => {
            showNotification('Unknown', { theme: 'nonexistent' });
            const el = document.body.querySelector('div');
            expect(el.style.background).toBe('rgb(58, 68, 102)');
        });
    });

    it('applies SNES-style font and positioning', () => {
        showNotification('Style');
        const el = document.body.querySelector('div');
        expect(el.style.fontFamily).toContain('Press Start 2P');
        expect(el.style.position).toBe('absolute');
        expect(el.style.left).toBe('50%');
        expect(el.style.zIndex).toBe('1000');
    });
});
