// engine/animation.js
// Rate-limited animation frame counter.

/**
 * Create an animation counter that cycles through frames at a given interval.
 * @param {object} opts
 * @param {number} opts.frames - Number of frames in the cycle
 * @param {number} opts.interval - Ticks between frame advances
 * @returns {{ update: Function, frame: number, reset: Function }}
 */
export function createAnimationCounter({ frames, interval }) {
    let frame = 0;
    let counter = 0;

    return {
        update() {
            counter++;
            if (counter >= interval) {
                frame = (frame + 1) % frames;
                counter = 0;
            }
            return frame;
        },
        get frame() { return frame; },
        reset() {
            frame = 0;
            counter = 0;
        },
    };
}
