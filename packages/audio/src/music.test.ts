/**
 * Music gain scheduling.
 *
 * `setMusicMuted(muted, 0)` has to apply the change immediately. It originally
 * called linearRampToValueAtTime for every call, so a zero ramp scheduled a ramp
 * *ending at* currentTime — which leaves the gain where it was instead of
 * snapping (commit 2c41632). The arcade's mute buttons pass rampTime 0, so
 * muting silently did nothing.
 *
 * These drive the real scheduling path, which means getting far enough through
 * playMusic() for musicGain to exist. A test that leaves it null passes against
 * the broken implementation too.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

type Call = [string, ...number[]];
const calls: Call[] = [];

/** Offsets passed to BufferSourceNode.start(), one per source created. */
const sourceStarts: number[] = [];
const sourceStops: number[] = [];
const sources: unknown[] = [];

function makeGainParam() {
  return {
    value: 0.3,
    cancelScheduledValues: vi.fn((t: number) => { calls.push(['cancel', t]); }),
    setValueAtTime: vi.fn((v: number, t: number) => { calls.push(['set', v, t]); }),
    linearRampToValueAtTime: vi.fn((v: number, t: number) => { calls.push(['ramp', v, t]); }),
  };
}

const ctx = {
  currentTime: 10,
  state: 'running',
  destination: {},
  createGain: vi.fn(() => ({ gain: makeGainParam(), connect: vi.fn(), disconnect: vi.fn() })),
  createBufferSource: vi.fn(() => {
    const node = {
      buffer: null as { duration: number } | null,
      loop: false,
      onended: null,
      connect: vi.fn(),
      // start(when, offset) — the offset is what says whether a resume picked
      // up where it left off or went back to the top of the track.
      start: vi.fn((_when?: number, offset?: number) => { sourceStarts.push(offset ?? 0); }),
      stop: vi.fn(() => { sourceStops.push(ctx.currentTime); }),
    };
    sources.push(node);
    return node;
  }),
  decodeAudioData: vi.fn(async () => ({ duration: 30 })),
};

vi.mock('./audio-context.js', () => ({
  getCtx: () => ctx,
  resumeCtx: async () => {},
  closeCtx: () => {},
}));

let music: typeof import('./music.js');

/** Load and start a track so musicGain is real. */
async function withPlayingTrack(volume = 0.3) {
  globalThis.fetch = vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })) as never;
  await music.loadMusic('bg.ogg', { volume });
  await music.playMusic(2.0);
  calls.length = 0;            // ignore the fade-in from playMusic
}

beforeEach(async () => {
  vi.resetModules();
  calls.length = 0;
  sourceStarts.length = 0;
  sourceStops.length = 0;
  sources.length = 0;
  ctx.currentTime = 10;
  visibilityListeners.length = 0;
  hidden = false;
  music = await import('./music.js');
});

// ── document stub, for the visibility handler ────────────────────────────────

let hidden = false;
const visibilityListeners: (() => void)[] = [];

vi.stubGlobal('document', {
  get hidden() { return hidden; },
  addEventListener: (type: string, fn: () => void) => {
    if (type === 'visibilitychange') visibilityListeners.push(fn);
  },
  removeEventListener: (type: string, fn: () => void) => {
    if (type !== 'visibilitychange') return;
    const i = visibilityListeners.indexOf(fn);
    if (i >= 0) visibilityListeners.splice(i, 1);
  },
});

/** Flip document.hidden and fire the handler, as a real tab switch would. */
async function setHidden(value: boolean) {
  hidden = value;
  for (const fn of visibilityListeners) fn();
  await Promise.resolve();      // playMusic() is async
}

describe('setMusicMuted with rampTime 0', () => {
  it('snaps with setValueAtTime and schedules no ramp', async () => {
    await withPlayingTrack();
    music.setMusicMuted(true, 0);

    const kinds = calls.map((c) => c[0]);
    expect(kinds).toContain('set');
    expect(kinds).not.toContain('ramp');          // the actual 2c41632 regression

    const set = calls.find((c) => c[0] === 'set')!;
    expect(set[1]).toBe(0);                        // muted -> gain 0
    expect(set[2]).toBe(ctx.currentTime);          // applied now, not later
  });

  it('unmutes back to the configured volume', async () => {
    await withPlayingTrack(0.42);
    music.setMusicMuted(true, 0);
    calls.length = 0;
    music.setMusicMuted(false, 0);

    const set = calls.find((c) => c[0] === 'set')!;
    expect(set[1]).toBeCloseTo(0.42);
    expect(calls.map((c) => c[0])).not.toContain('ramp');
  });

  it('still ramps when a ramp time is given', async () => {
    await withPlayingTrack();
    music.setMusicMuted(true, 0.5);

    const kinds = calls.map((c) => c[0]);
    expect(kinds).toContain('ramp');
    const ramp = calls.find((c) => c[0] === 'ramp')!;
    expect(ramp[1]).toBe(0);
    expect(ramp[2]).toBeCloseTo(ctx.currentTime + 0.5);
  });

  it('cancels pending automation before scheduling, so a fade-in cannot override it', async () => {
    await withPlayingTrack();
    music.setMusicMuted(true, 0);
    expect(calls[0]?.[0]).toBe('cancel');
  });
});

describe('mute state', () => {
  it('toggles and reports', async () => {
    await withPlayingTrack();
    expect(music.isMusicMuted()).toBe(false);
    expect(music.toggleMusicMute()).toBe(true);
    expect(music.isMusicMuted()).toBe(true);
    expect(music.toggleMusicMute()).toBe(false);
  });

  it('does not throw before a track is loaded', () => {
    expect(() => music.setMusicMuted(true, 0)).not.toThrow();
    expect(() => music.setMusicVolume(0.3)).not.toThrow();
  });
});


// ── Resuming after a pause ───────────────────────────────────────────────────
//
// pauseMusic() used to stop the source without recording how far it had got,
// and playMusic() always called start(0). So every resume — and every
// tab-return, via onVisibilityChange — replayed the track from its opening.

describe('pauseMusic / playMusic round trip', () => {
  it('resumes from where it paused rather than the top', async () => {
    await withPlayingTrack();
    expect(sourceStarts).toEqual([0]);          // first play starts at the top

    ctx.currentTime = 22;                        // 12s of playback
    music.pauseMusic();
    await music.playMusic(0);

    expect(sourceStarts).toEqual([0, 12]);
  });

  it('accumulates across several pauses', async () => {
    await withPlayingTrack();
    ctx.currentTime = 15; music.pauseMusic(); await music.playMusic(0);   // +5
    ctx.currentTime = 19; music.pauseMusic(); await music.playMusic(0);   // +4
    expect(sourceStarts).toEqual([0, 5, 9]);
  });

  it('wraps the offset into the buffer, since the source loops', async () => {
    await withPlayingTrack();                    // buffer duration is 30
    ctx.currentTime = 55;                        // 45s of playback
    music.pauseMusic();
    await music.playMusic(0);
    // 45 % 30 — an unwrapped 45 would clamp to the end and pin a looping
    // track to its final sample.
    expect(sourceStarts).toEqual([0, 15]);
  });

  it('stopMusic is an end, not a pause, so the next play starts at the top', async () => {
    await withPlayingTrack();
    ctx.currentTime = 20;
    music.stopMusic();
    await music.playMusic(0);
    expect(sourceStarts).toEqual([0, 0]);
  });
});

// ── The visibility handler ───────────────────────────────────────────────────

describe('onVisibilityChange', () => {
  it('resumes a hidden-paused track from its playhead', async () => {
    await withPlayingTrack();
    music.onVisibilityChange(true);

    ctx.currentTime = 18;                        // 8s in
    await setHidden(true);
    expect(music.isMusicPlaying()).toBe(false);

    await setHidden(false);
    expect(music.isMusicPlaying()).toBe(true);
    expect(sourceStarts).toEqual([0, 8]);
  });

  it('does not start music that was never playing', async () => {
    // A loaded track that the app has deliberately not started: a title
    // screen, or a game whose music belongs to a run in progress.
    globalThis.fetch = vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })) as never;
    await music.loadMusic('bg.ogg', {});
    music.onVisibilityChange(true);

    await setHidden(true);
    await setHidden(false);

    expect(sourceStarts).toEqual([]);
    expect(music.isMusicPlaying()).toBe(false);
  });

  it('does not resume a track the app paused itself', async () => {
    await withPlayingTrack();
    music.onVisibilityChange(true);
    music.pauseMusic();                          // the app's own decision

    await setHidden(true);
    await setHidden(false);                      // must not undo it

    expect(music.isMusicPlaying()).toBe(false);
    expect(sourceStarts).toEqual([0]);
  });

  it('does nothing at all when pause is false', async () => {
    await withPlayingTrack();
    music.onVisibilityChange(false);
    await setHidden(true);
    expect(music.isMusicPlaying()).toBe(true);
  });
});
