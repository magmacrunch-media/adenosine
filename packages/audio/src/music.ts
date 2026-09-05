import { getCtx, resumeCtx } from './audio-context.js';

let musicBuffer: AudioBuffer | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let musicGain: GainNode | null = null;
let musicStarted = false;
let musicMuted = false;
let musicVolume = 0.3;
let visibilityHandler: (() => void) | null = null;

/**
 * Where the playhead is, so a pause can be resumed rather than restarted.
 *
 * A BufferSourceNode cannot be restarted once stopped, and it does not report
 * how far it got, so the elapsed time has to be tracked by hand: the context
 * clock is read when a source starts and again when it is stopped.
 *
 * Without this, pauseMusic() threw the position away and playMusic() started
 * the buffer at 0, so a tab-away and back replayed the track from its opening.
 * Easy to miss on a long ambient bed, very audible on a short loop.
 */
let musicStartedAt = 0;      // ctx.currentTime when the live source began
let musicOffset = 0;         // seconds into the buffer that source began at

/**
 * Whether the visibility handler is the reason music is not playing.
 *
 * Its resume branch used to fire on any `musicBuffer`, i.e. on nothing more
 * than a track having been loaded — so a page that deliberately had not
 * started its music (a title screen, or a game that only plays during a run)
 * began playing on the first tab-return, with no playMusic() call anywhere in
 * the app. Only what this handler paused is resumed by it.
 */
let pausedByVisibility = false;

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
  // Resume where the last pause left off. `loop` means the offset must be
  // wrapped: start() throws nothing for an offset past the buffer, it simply
  // clamps, which would silently pin a resumed loop to the final sample.
  musicOffset = musicBuffer.duration > 0 ? musicOffset % musicBuffer.duration : 0;
  musicSource.start(0, musicOffset);
  musicStartedAt = ctx.currentTime;

  const target = musicMuted ? 0 : musicVolume;
  musicGain.gain.linearRampToValueAtTime(target, ctx.currentTime + fadeIn);
  musicStarted = true;
}

/** Stop playback, remembering the playhead so playMusic() resumes from it. */
export function pauseMusic(): void {
  if (musicSource) {
    // Banked before the node goes, since nothing can be read from it after.
    musicOffset += getCtx().currentTime - musicStartedAt;
    musicSource.onended = null;
    musicSource.stop();
    musicSource = null;
  }
  musicStarted = false;
}

/** End playback. Unlike pauseMusic(), the next play starts from the top. */
export function stopMusic(): void {
  pauseMusic();
  musicOffset = 0;
  pausedByVisibility = false;
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
    if (!pause) return;
    if (document.hidden) {
      if (musicStarted) {
        pausedByVisibility = true;
        pauseMusic();
      }
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      void playMusic(0);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
}

export function destroyMusic(): void {
  stopMusic();
  musicBuffer = null;
  musicStarted = false;
  musicMuted = false;
  musicOffset = 0;
  musicStartedAt = 0;
  pausedByVisibility = false;
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
}
