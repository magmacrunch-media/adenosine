import { getCtx, resumeCtx } from './audio-context.js';

let musicBuffer: AudioBuffer | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let musicGain: GainNode | null = null;
let musicStarted = false;
let musicMuted = false;
let musicVolume = 0.3;
let visibilityHandler: (() => void) | null = null;

export async function loadMusic(url: string, opts?: { volume?: number; fadeIn?: number }): Promise<void> {
  musicVolume = opts?.volume ?? 0.3;
  const res = await fetch(url);
  const arrayBuf = await res.arrayBuffer();
  musicBuffer = await getCtx().decodeAudioData(arrayBuf);
}

export async function playMusic(fadeIn = 2.0): Promise<void> {
  if (!musicBuffer || musicStarted) return;
  await resumeCtx();

  const ctx = getCtx();
  musicGain = ctx.createGain();
  musicGain.connect(ctx.destination);
  musicGain.gain.setValueAtTime(0, ctx.currentTime);

  musicSource = ctx.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop = true;
  musicSource.connect(musicGain);
  musicSource.start(0);

  const target = musicMuted ? 0 : musicVolume;
  musicGain.gain.linearRampToValueAtTime(target, ctx.currentTime + fadeIn);
  musicStarted = true;
}

export function pauseMusic(): void {
  if (musicSource) {
    musicSource.onended = null;
    musicSource.stop();
    musicSource = null;
  }
  musicStarted = false;
}

export function stopMusic(): void {
  pauseMusic();
  if (musicGain) {
    musicGain.disconnect();
    musicGain = null;
  }
}

export function setMusicVolume(volume: number, rampTime = 0.5): void {
  musicVolume = volume;
  if (musicGain && !musicMuted) {
    const ctx = getCtx();
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + rampTime);
  }
}

export function setMusicMuted(muted: boolean, rampTime = 0.5): void {
  musicMuted = muted;
  if (musicGain) {
    const ctx = getCtx();
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    if (rampTime <= 0) {
      musicGain.gain.setValueAtTime(muted ? 0 : musicVolume, ctx.currentTime);
    } else {
      musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(muted ? 0 : musicVolume, ctx.currentTime + rampTime);
    }
  }
}

export function isMusicMuted(): boolean {
  return musicMuted;
}

export function toggleMusicMute(): boolean {
  setMusicMuted(!musicMuted);
  return musicMuted;
}

export function isMusicPlaying(): boolean {
  return musicStarted;
}

export function onVisibilityChange(pause: boolean): void {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  visibilityHandler = () => {
    if (document.hidden && pause && musicStarted) {
      pauseMusic();
    } else if (!document.hidden && pause && musicBuffer) {
      playMusic(0);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
}

export function destroyMusic(): void {
  stopMusic();
  musicBuffer = null;
  musicStarted = false;
  musicMuted = false;
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
}
