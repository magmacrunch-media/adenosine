import { describe, it, expect } from 'vitest';
import { createAnimationCounter } from './animation.js';

describe('createAnimationCounter', () => {
    it('starts at frame 0', () => {
        const anim = createAnimationCounter({ frames: 4, interval: 5 });
        expect(anim.frame).toBe(0);
    });

    it('does not advance frame before interval', () => {
        const anim = createAnimationCounter({ frames: 4, interval: 5 });
        anim.update();
        anim.update();
        anim.update();
        expect(anim.frame).toBe(0);
    });

    it('advances frame at interval', () => {
        const anim = createAnimationCounter({ frames: 4, interval: 5 });
        for (let i = 0; i < 5; i++) anim.update();
        expect(anim.frame).toBe(1);
    });

    it('cycles through all frames', () => {
        const anim = createAnimationCounter({ frames: 4, interval: 3 });
        const frames = [];
        for (let i = 0; i < 12; i++) {
            anim.update();
            frames.push(anim.frame);
        }
        expect(frames).toEqual([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0]);
    });

    it('returns current frame from update()', () => {
        const anim = createAnimationCounter({ frames: 4, interval: 5 });
        expect(anim.update()).toBe(0);
        for (let i = 0; i < 5; i++) anim.update();
        expect(anim.update()).toBe(1);
    });

    it('reset returns to frame 0', () => {
        const anim = createAnimationCounter({ frames: 4, interval: 3 });
        for (let i = 0; i < 9; i++) anim.update();
        expect(anim.frame).toBe(3);
        anim.reset();
        expect(anim.frame).toBe(0);
    });

    it('multiple instances are independent', () => {
        const a = createAnimationCounter({ frames: 4, interval: 3 });
        const b = createAnimationCounter({ frames: 2, interval: 5 });
        for (let i = 0; i < 6; i++) {
            a.update();
            b.update();
        }
        expect(a.frame).toBe(2);
        expect(b.frame).toBe(1);
    });

    it('works with single frame', () => {
        const anim = createAnimationCounter({ frames: 1, interval: 1 });
        anim.update();
        expect(anim.frame).toBe(0);
        anim.update();
        expect(anim.frame).toBe(0);
    });
});
