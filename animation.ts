// engine/animation.ts
// Rate-limited animation frame counter.

import type { AnimationCounter, AnimationCounterOpts } from './types.js';

export function createAnimationCounter({ frames, interval }: AnimationCounterOpts): AnimationCounter {
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
