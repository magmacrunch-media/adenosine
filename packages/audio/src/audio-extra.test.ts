/**
 * Audio init, SFX pooling, and destroy.
 *
 * The music.test.ts covers gain scheduling. These cover the remaining surface:
 * init() manifest processing, SFX loading/playback/pooling, and destroy() teardown.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const gainNodes: ReturnType<typeof makeGain>[] = [];
const bufferSources: ReturnType<typeof makeBufferSource>[] = [];

function makeGain() {
  return {
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function makeBufferSource() {
  return {
    buffer: null as AudioBuffer | null,
    loop: false,
    onended: null as (() => void) | null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

const ctx = {
  currentTime: 10,
  state: 'running' as AudioContextState,
  destination: {},
  createGain: vi.fn(() => { const g = makeGain(); gainNodes.push(g); return g; }),
  createBufferSource: vi.fn(() => { const s = makeBufferSource(); bufferSources.push(s); return s; }),
  decodeAudioData: vi.fn(async () => ({ duration: 1 } as AudioBuffer)),
  resume: vi.fn(async () => {}),
  close: vi.fn(),
};

vi.mock('./audio-context.js', () => ({
  getCtx: () => ctx,
  resumeCtx: async () => {},
  closeCtx: () => { ctx.close(); },
}));

// init() calls onVisibilityChange which needs document.addEventListener
(globalThis as Record<string, unknown>)['document'] = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  hidden: false,
  visibilityState: 'visible',
};

let audio: typeof import('./index.js');

beforeEach(async () => {
  vi.resetModules();
  gainNodes.length = 0;
  bufferSources.length = 0;
  ctx.currentTime = 10;
  ctx.state = 'running';
  ctx.close.mockClear();
  globalThis.fetch = vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })) as never;
  audio = await import('./index.js');
});

describe('init()', () => {
  it('loads music when manifest has music config', async () => {
    await audio.init({ music: { url: 'bg.ogg', volume: 0.6, fadeIn: 1.5 } });
    expect(globalThis.fetch).toHaveBeenCalledWith('bg.ogg');
    expect(ctx.decodeAudioData).toHaveBeenCalled();
  });

  it('loads all sfx entries in parallel', async () => {
    await audio.init({
      sfx: {
        move: { url: 'move.ogg', volume: 0.8, pool: 2 },
        crash: { url: 'crash.ogg' },
      },
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenCalledWith('move.ogg');
    expect(globalThis.fetch).toHaveBeenCalledWith('crash.ogg');
  });

  it('does not throw with empty manifest', async () => {
    await expect(audio.init({})).resolves.toBeUndefined();
  });

  it('defaults sfx volume to 0.5 when not specified', async () => {
    await audio.init({ sfx: { beep: { url: 'beep.ogg' } } });
    await audio.playSfx('beep');
    expect(bufferSources.length).toBe(1);
    expect(gainNodes.length).toBe(1);
    expect(gainNodes[0].gain.setValueAtTime).toHaveBeenCalledWith(0.5, 10);
  });
});

describe('SFX playback', () => {
  it('plays a loaded sfx by name', async () => {
    await audio.init({ sfx: { click: { url: 'click.ogg', volume: 0.7 } } });
    await audio.playSfx('click');

    expect(bufferSources.length).toBe(1);
    expect(bufferSources[0].buffer).toBeTruthy();
    expect(bufferSources[0].start).toHaveBeenCalledWith(0);
    expect(gainNodes[0].gain.setValueAtTime).toHaveBeenCalledWith(0.7, 10);
  });

  it('does not throw when playing an unknown sfx', async () => {
    await expect(audio.playSfx('nonexistent')).resolves.toBeUndefined();
  });

  it('respects global volume multiplier', async () => {
    await audio.init({ sfx: { beep: { url: 'beep.ogg', volume: 0.5 } } });
    audio.setSfxGlobalVolume(0.5);
    await audio.playSfx('beep');
    expect(gainNodes[0].gain.setValueAtTime).toHaveBeenCalledWith(0.25, 10);
  });

  it('skips playback when muted', async () => {
    await audio.init({ sfx: { beep: { url: 'beep.ogg' } } });
    audio.setSfxMuted(true);
    await audio.playSfx('beep');
    expect(bufferSources.length).toBe(0);
  });

  it('cleans up gain node on ended', async () => {
    await audio.init({ sfx: { beep: { url: 'beep.ogg' } } });
    await audio.playSfx('beep');
    const source = bufferSources[0];
    const gain = gainNodes[0];

    source.onended!();
    expect(gain.disconnect).toHaveBeenCalled();
  });

  it('setSfxVolume updates the entry', async () => {
    await audio.init({ sfx: { beep: { url: 'beep.ogg', volume: 0.3 } } });
    audio.setSfxVolume('beep', 0.9);
    await audio.playSfx('beep');
    expect(gainNodes[0].gain.setValueAtTime).toHaveBeenCalledWith(0.9, 10);
  });
});

describe('SFX mute state', () => {
  it('toggles and reports', async () => {
    expect(audio.isSfxMuted()).toBe(false);
    expect(audio.toggleSfxMute()).toBe(true);
    expect(audio.isSfxMuted()).toBe(true);
    expect(audio.toggleSfxMute()).toBe(false);
  });
});

describe('destroy()', () => {
  it('closes the audio context', async () => {
    await audio.init({ music: { url: 'bg.ogg' } });
    audio.destroy();
    expect(ctx.close).toHaveBeenCalled();
  });

  it('clears sfx map so playSfx is a no-op after destroy', async () => {
    await audio.init({ sfx: { beep: { url: 'beep.ogg' } } });
    audio.destroy();
    await audio.playSfx('beep');
    expect(bufferSources.length).toBe(0);
  });

  it('resets mute state after destroy', async () => {
    audio.setSfxMuted(true);
    audio.destroy();
    expect(audio.isSfxMuted()).toBe(false);
  });
});
