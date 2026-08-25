import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpriteSheet, loadSpriteSheet, loadSpriteSheets } from './sprites.js';

function mockCtx() {
    return {
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        fillStyle: '',
        globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;
}

/** A 4-frame single-row 16x16 sheet, the shape the sprite editor exports. */
function strip() {
    return createSpriteSheet({ width: 64, height: 16 } as CanvasImageSource, {
        frameWidth: 16,
        frameHeight: 16,
    });
}

describe('createSpriteSheet', () => {
    it('derives the grid from the image size', () => {
        const sheet = strip();
        expect(sheet.cols).toBe(4);
        expect(sheet.rows).toBe(1);
        expect(sheet.frameCount).toBe(4);
    });

    it('derives a multi-row grid', () => {
        const sheet = createSpriteSheet({ width: 64, height: 48 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
        });
        expect([sheet.cols, sheet.rows, sheet.frameCount]).toEqual([4, 3, 12]);
    });

    it('ignores a trailing partial frame', () => {
        const sheet = createSpriteSheet({ width: 70, height: 16 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
        });
        expect(sheet.cols).toBe(4);
    });

    it('prefers naturalWidth over width', () => {
        const img = { width: 999, height: 999, naturalWidth: 64, naturalHeight: 16 };
        const sheet = createSpriteSheet(img as CanvasImageSource, { frameWidth: 16, frameHeight: 16 });
        expect(sheet.cols).toBe(4);
    });

    it('rejects a non-positive frame size', () => {
        const img = { width: 64, height: 16 } as CanvasImageSource;
        expect(() => createSpriteSheet(img, { frameWidth: 0, frameHeight: 16 })).toThrow(/positive/);
        expect(() => createSpriteSheet(img, { frameWidth: 16, frameHeight: -4 })).toThrow(/positive/);
    });
});

describe('draw', () => {
    let ctx: CanvasRenderingContext2D;
    beforeEach(() => { ctx = mockCtx(); });

    it('maps a frame index to its column on a single row', () => {
        const sheet = strip();
        sheet.draw(ctx, 2, 100, 50);
        expect(ctx.drawImage).toHaveBeenCalledWith(sheet.image, 32, 0, 16, 16, 100, 50, 16, 16);
    });

    it('wraps a frame index onto later rows', () => {
        const sheet = createSpriteSheet({ width: 64, height: 32 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
        });
        sheet.draw(ctx, 5, 0, 0);
        // frame 5 of a 4-wide grid is col 1, row 1
        expect(ctx.drawImage).toHaveBeenCalledWith(sheet.image, 16, 16, 16, 16, 0, 0, 16, 16);
    });

    it('lands the origin on the given point', () => {
        const sheet = createSpriteSheet({ width: 64, height: 16 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
            originX: 8,
            originY: 15,
        });
        sheet.draw(ctx, 0, 100, 200);
        expect(ctx.drawImage).toHaveBeenCalledWith(sheet.image, 0, 0, 16, 16, 92, 185, 16, 16);
    });

    it('scales the origin offset with the sprite', () => {
        const sheet = createSpriteSheet({ width: 64, height: 16 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
            originX: 8,
            originY: 16,
        });
        sheet.draw(ctx, 0, 100, 200, { scaleX: 2, scaleY: 2 });
        // origin stays on (100,200): 100 - 8*2 = 84, 200 - 16*2 = 168
        expect(ctx.drawImage).toHaveBeenCalledWith(sheet.image, 0, 0, 16, 16, 84, 168, 32, 32);
    });

    it('takes the fast path when untransformed', () => {
        strip().draw(ctx, 0, 0, 0);
        expect(ctx.save).not.toHaveBeenCalled();
        expect(ctx.restore).not.toHaveBeenCalled();
    });
});

describe('flipping', () => {
    let ctx: CanvasRenderingContext2D;
    beforeEach(() => { ctx = mockCtx(); });

    it('mirrors about the origin', () => {
        const sheet = createSpriteSheet({ width: 64, height: 16 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
            originX: 8,
            originY: 15,
        });
        sheet.draw(ctx, 1, 100, 200, { flipX: true });
        expect(ctx.translate).toHaveBeenCalledWith(100, 200);
        expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
        expect(ctx.drawImage).toHaveBeenCalledWith(sheet.image, 16, 0, 16, 16, -8, -15, 16, 16);
        expect(ctx.restore).toHaveBeenCalled();
    });

    it('flips vertically', () => {
        strip().draw(ctx, 0, 0, 0, { flipY: true });
        expect(ctx.scale).toHaveBeenCalledWith(1, -1);
    });

    it('always restores the context it saved', () => {
        strip().draw(ctx, 0, 0, 0, { flipX: true, alpha: 0.5 });
        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
    });
});

describe('alpha', () => {
    it('multiplies into the existing globalAlpha rather than replacing it', () => {
        const ctx = mockCtx();
        ctx.globalAlpha = 0.5;
        strip().draw(ctx, 0, 0, 0, { alpha: 0.5 });
        expect(ctx.globalAlpha).toBeCloseTo(0.25);
    });

    it('does not save the context for alpha 1', () => {
        const ctx = mockCtx();
        strip().draw(ctx, 0, 0, 0, { alpha: 1 });
        expect(ctx.save).not.toHaveBeenCalled();
    });
});

describe('out of range', () => {
    let ctx: CanvasRenderingContext2D;
    beforeEach(() => { ctx = mockCtx(); });

    it('draws magenta instead of throwing', () => {
        strip().draw(ctx, 99, 10, 20);
        expect(ctx.drawImage).not.toHaveBeenCalled();
        expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 16, 16);
        expect(ctx.fillStyle).toBe('#ff00ff');
    });

    it('flags a negative cell', () => {
        strip().drawCell(ctx, -1, 0, 0, 0);
        expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('flags a sheet smaller than one frame rather than dividing by zero', () => {
        const sheet = createSpriteSheet({ width: 8, height: 8 } as CanvasImageSource, {
            frameWidth: 16,
            frameHeight: 16,
        });
        expect(sheet.frameCount).toBe(0);
        sheet.draw(ctx, 0, 0, 0);
        expect(ctx.fillRect).toHaveBeenCalled();
        expect(ctx.drawImage).not.toHaveBeenCalled();
    });
});

describe('origin is mutable after load', () => {
    it('uses the updated origin', () => {
        const ctx = mockCtx();
        const sheet = strip();
        sheet.originX = 8;
        sheet.originY = 16;
        sheet.draw(ctx, 0, 100, 100);
        expect(ctx.drawImage).toHaveBeenCalledWith(sheet.image, 0, 0, 16, 16, 92, 84, 16, 16);
    });
});

describe('loadSpriteSheet', () => {
    class FakeImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 64;
        height = 16;
        #src = '';
        set src(v: string) {
            this.#src = v;
            queueMicrotask(() => {
                if (v.includes('missing')) this.onerror?.();
                else this.onload?.();
            });
        }
        get src() { return this.#src; }
    }

    beforeEach(() => {
        vi.stubGlobal('Image', FakeImage);
    });

    it('resolves to a sheet once the image loads', async () => {
        const sheet = await loadSpriteSheet('hero_16x16.png', { frameWidth: 16, frameHeight: 16 });
        expect(sheet.frameCount).toBe(4);
    });

    it('carries the origin through', async () => {
        const sheet = await loadSpriteSheet('hero.png', { frameWidth: 16, frameHeight: 16, originY: 15 });
        expect(sheet.originY).toBe(15);
    });

    it('rejects naming the file that failed', async () => {
        await expect(loadSpriteSheet('missing.png', { frameWidth: 16, frameHeight: 16 }))
            .rejects.toThrow(/missing\.png/);
    });

    it('loads several sheets keyed by name', async () => {
        const art = await loadSpriteSheets({
            hero: ['hero.png', { frameWidth: 16, frameHeight: 16 }],
            slime: ['slime.png', { frameWidth: 32, frameHeight: 16 }],
        });
        expect(art.hero.frameCount).toBe(4);
        expect(art.slime.frameCount).toBe(2);
    });

    it('rejects the batch if any sheet fails', async () => {
        await expect(loadSpriteSheets({
            hero: ['hero.png', { frameWidth: 16, frameHeight: 16 }],
            gone: ['missing.png', { frameWidth: 16, frameHeight: 16 }],
        })).rejects.toThrow(/missing\.png/);
    });
});
