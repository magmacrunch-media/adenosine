// engine/sprites.ts
// Uniform-grid sprite sheet loading and drawing.
//
// The grid is the same one magnolia and texastoast read, so a sheet exported
// once feeds all three engines: frames are frameWidth × frameHeight cells,
// counted left-to-right then top-to-bottom. A single-row sheet therefore has
// frame i at column i, which is what the sprite editor writes.
//
// The origin travels with the sheet rather than being re-derived at each call
// site, matching magnolia's sprite_load(&s, path, origin_x, origin_y): draw()
// lands that pixel on the (x, y) you pass, so a sprite whose origin is at its
// feet stays planted when it grows, shrinks or turns around.

import type {
    SpriteSheet,
    SpriteSheetOpts,
} from './types.js';

/**
 * Wraps an already-loaded image. Use when the image comes from somewhere other
 * than a URL — a canvas, an ImageBitmap, or a preloader the game already has.
 */
export function createSpriteSheet(
    image: CanvasImageSource,
    { frameWidth, frameHeight, originX = 0, originY = 0 }: SpriteSheetOpts,
): SpriteSheet {
    if (!(frameWidth > 0) || !(frameHeight > 0)) {
        throw new Error(`createSpriteSheet: frame size must be positive, got ${frameWidth}×${frameHeight}`);
    }

    // Images report their size differently by type; SVGImageElement has none.
    const size = image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number };
    const imgW = size.naturalWidth ?? size.width ?? 0;
    const imgH = size.naturalHeight ?? size.height ?? 0;

    const cols = Math.floor(imgW / frameWidth);
    const rows = Math.floor(imgH / frameHeight);

    const sheet: SpriteSheet = {
        image,
        frameWidth,
        frameHeight,
        cols,
        rows,
        frameCount: cols * rows,
        originX,
        originY,

        drawCell(ctx, col, row, x, y, opts = {}) {
            const { scaleX = 1, scaleY = 1, flipX = false, flipY = false, alpha } = opts;
            const dw = frameWidth * scaleX;
            const dh = frameHeight * scaleY;

            // Out of range draws magenta rather than throwing or drawing
            // nothing, the same tell createSpriteRegistry uses for an
            // unregistered type: a render loop should surface the bug, not
            // stop, and a silent no-op looks like a sprite that failed to load.
            if (col < 0 || col >= cols || row < 0 || row >= rows) {
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(x - sheet.originX * scaleX, y - sheet.originY * scaleY, dw, dh);
                return;
            }

            const sx = col * frameWidth;
            const sy = row * frameHeight;
            const ox = sheet.originX * scaleX;
            const oy = sheet.originY * scaleY;

            const needsTransform = flipX || flipY;
            const needsAlpha = alpha !== undefined && alpha !== 1;
            if (!needsTransform && !needsAlpha) {
                ctx.drawImage(image, sx, sy, frameWidth, frameHeight, x - ox, y - oy, dw, dh);
                return;
            }

            ctx.save();
            if (needsAlpha) ctx.globalAlpha *= alpha;
            if (needsTransform) {
                // Translate to the origin first so the mirror happens about it.
                ctx.translate(x, y);
                ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                ctx.drawImage(image, sx, sy, frameWidth, frameHeight, -ox, -oy, dw, dh);
            } else {
                ctx.drawImage(image, sx, sy, frameWidth, frameHeight, x - ox, y - oy, dw, dh);
            }
            ctx.restore();
        },

        draw(ctx, frame, x, y, opts) {
            if (cols <= 0) {
                sheet.drawCell(ctx, -1, -1, x, y, opts);
                return;
            }
            sheet.drawCell(ctx, frame % cols, Math.floor(frame / cols), x, y, opts);
        },
    };

    return sheet;
}

/**
 * Loads a PNG sprite sheet. Rejects if the image fails to load, so a missing
 * asset surfaces at load time rather than as an empty screen later.
 */
export function loadSpriteSheet(src: string, opts: SpriteSheetOpts): Promise<SpriteSheet> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(createSpriteSheet(img, opts));
        img.onerror = () => reject(new Error(`loadSpriteSheet: failed to load "${src}"`));
        img.src = src;
    });
}

/**
 * Loads several sheets at once, keyed by name. Rejects if any one fails.
 *
 *   const art = await loadSpriteSheets({
 *       hero:  ['hero_32x32.png',  { frameWidth: 32, frameHeight: 32, originY: 31 }],
 *       slime: ['slime_16x16.png', { frameWidth: 16, frameHeight: 16 }],
 *   });
 *   art.hero.draw(ctx, walk.frame, x, y);
 */
export async function loadSpriteSheets<K extends string>(
    entries: Record<K, [src: string, opts: SpriteSheetOpts]>,
): Promise<Record<K, SpriteSheet>> {
    const names = Object.keys(entries) as K[];
    const sheets = await Promise.all(
        names.map((name) => {
            const [src, opts] = entries[name];
            return loadSpriteSheet(src, opts);
        }),
    );
    const out = {} as Record<K, SpriteSheet>;
    names.forEach((name, i) => { out[name] = sheets[i]!; });
    return out;
}
