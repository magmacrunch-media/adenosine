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
  createBufferSource: vi.fn(() => ({
    buffer: null, loop: false, onended: null,
    connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
  })),
  decodeAudioData: vi.fn(async () => ({ duration: 1 })),
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
  music = await import('./music.js');
});

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
