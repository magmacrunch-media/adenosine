import { getCtx, resumeCtx } from './audio-context.js';

interface SfxEntry {
  buffer: AudioBuffer;
  volume: number;
  pool: AudioBufferSourceNode[];
  poolSize: number;
}

const sfxMap = new Map<string, SfxEntry>();
let sfxMuted = false;
let sfxGlobalVolume = 1.0;

export async function loadSfx(name: string, url: string, opts?: { volume?: number; pool?: number }): Promise<void> {
  const res = await fetch(url);
  const arrayBuf = await res.arrayBuffer();
  const buffer = await getCtx().decodeAudioData(arrayBuf);
  sfxMap.set(name, {
    buffer,
    volume: opts?.volume ?? 0.5,
    pool: [],
    poolSize: opts?.pool ?? 1,
  });
}

export async function playSfx(name: string, opts?: { volume?: number }): Promise<void> {
  if (sfxMuted) return;
  const entry = sfxMap.get(name);
  if (!entry) return;
  await resumeCtx();

  const ctx = getCtx();
  const gain = ctx.createGain();
  const vol = (opts?.volume ?? entry.volume) * sfxGlobalVolume;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = entry.buffer;
  source.connect(gain);
  source.start(0);

  source.onended = () => {
    gain.disconnect();
    const idx = entry.pool.indexOf(source);
    if (idx !== -1) entry.pool.splice(idx, 1);
  };

  if (entry.pool.length < entry.poolSize) {
    entry.pool.push(source);
  }
}

export function setSfxVolume(name: string, volume: number): void {
  const entry = sfxMap.get(name);
  if (entry) entry.volume = volume;
}

export function setSfxGlobalVolume(volume: number): void {
  sfxGlobalVolume = volume;
}

export function setSfxMuted(muted: boolean): void {
  sfxMuted = muted;
}

export function isSfxMuted(): boolean {
  return sfxMuted;
}

export function destroySfx(): void {
  sfxMap.clear();
  sfxMuted = false;
  sfxGlobalVolume = 1.0;
}
