import type { AudioManifest, VisibilityOptions } from './types.js';
import {
  loadMusic as _loadMusic,
  playMusic as _playMusic,
  pauseMusic as _pauseMusic,
  stopMusic as _stopMusic,
  setMusicVolume as _setMusicVolume,
  setMusicMuted as _setMusicMuted,
  isMusicMuted as _isMusicMuted,
  isMusicPlaying as _isMusicPlaying,
  onVisibilityChange,
  destroyMusic,
} from './music.js';
import {
  loadSfx as _loadSfx,
  playSfx as _playSfx,
  setSfxVolume as _setSfxVolume,
  setSfxGlobalVolume as _setSfxGlobalVolume,
  setSfxMuted as _setSfxMuted,
  isSfxMuted as _isSfxMuted,
  destroySfx,
} from './sfx.js';
import { closeCtx } from './audio-context.js';

let musicFadeIn = 2.0;

export async function init(manifest: AudioManifest): Promise<void> {
  if (manifest.music) {
    await _loadMusic(manifest.music.url, {
      volume: manifest.music.volume,
      fadeIn: manifest.music.fadeIn,
    });
    musicFadeIn = manifest.music.fadeIn ?? 2.0;
  }

  if (manifest.sfx) {
    const entries = Object.entries(manifest.sfx);
    await Promise.all(
      entries.map(([name, cfg]) => _loadSfx(name, cfg.url, { volume: cfg.volume, pool: cfg.pool }))
    );
  }

  if (manifest.autoVisibility !== false) {
    onVisibilityChange(true);
  }
}

export async function playMusic(fadeIn?: number): Promise<void> {
  await _playMusic(fadeIn ?? musicFadeIn);
}

export function destroy(): void {
  destroyMusic();
  destroySfx();
  closeCtx();
}

export {
  _loadMusic as loadMusic,
  _pauseMusic as pauseMusic,
  _stopMusic as stopMusic,
  _setMusicVolume as setMusicVolume,
  _setMusicMuted as setMusicMuted,
  _isMusicMuted as isMusicMuted,
  _isMusicPlaying as isMusicPlaying,
  _loadSfx as loadSfx,
  _playSfx as playSfx,
  _setSfxVolume as setSfxVolume,
  _setSfxGlobalVolume as setSfxGlobalVolume,
  _setSfxMuted as setSfxMuted,
  _isSfxMuted as isSfxMuted,
  onVisibilityChange as handleVisibility,
};

export type { AudioManifest, MusicConfig, SfxConfig, VisibilityOptions } from './types.js';
