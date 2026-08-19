# API Reference — adenosine-audio

Web Audio API engine for game music and sound effects.

## Table of Contents

- [init](#init) — Initialize audio system
- [Music](#music) — Background music controls
- [SFX](#sfx) — Sound effect controls
- [Lifecycle](#lifecycle) — Visibility and cleanup
- [Types](#types)

---

## init

### `init(manifest)`

Initialize the audio system with a manifest describing music and sound effects.

| Param | Type | Description |
|-------|------|-------------|
| `manifest` | `AudioManifest` | Audio configuration |

```js
AdAudio.init({
  music: { url: 'audio/music.ogg', volume: 0.7, fadeIn: 2.0 },
  sfx: {
    move:   { url: 'audio/sfx/move.ogg', volume: 0.8 },
    crash:  { url: 'audio/sfx/crash.ogg', volume: 1.0, pool: 4 },
    spawn:  { url: 'audio/sfx/spawn.ogg' },
  },
  autoVisibility: true,
});
```

---

## Music

### `playMusic(fadeIn?)`

Start background music with a fade-in.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `fadeIn` | `number` | `2.0` (from manifest) | Fade-in duration in seconds |

### `pauseMusic()`

Pause the currently playing music.

### `stopMusic()`

Stop the currently playing music.

### `setMusicVolume(vol)`

Set the music volume (0.0 to 1.0).

### `setMusicMuted(muted)`

Mute or unmute music.

### `isMusicMuted()`

Returns `boolean` — whether music is currently muted.

### `isMusicPlaying()`

Returns `boolean` — whether music is currently playing.

### `toggleMusicMute()`

Toggle music mute state. Returns the new mute state (`boolean`).

### `loadMusic(url, config?)`

Load a music track without playing it.

| Param | Type | Description |
|-------|------|-------------|
| `url` | `string` | URL of the audio file |
| `config` | `{ volume?: number; fadeIn?: number }` | Optional configuration |

---

## SFX

### `playSfx(name)`

Play a named sound effect.

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Name defined in the manifest's `sfx` map |

### `setSfxVolume(vol)`

Set the SFX volume (0.0 to 1.0).

### `setSfxGlobalVolume(vol)`

Set the global SFX volume multiplier (0.0 to 1.0).

### `setSfxMuted(muted)`

Mute or unmute all sound effects.

### `isSfxMuted()`

Returns `boolean` — whether SFX is currently muted.

### `toggleSfxMute()`

Toggle SFX mute state. Returns the new mute state (`boolean`).

### `loadSfx(name, url, config?)`

Load a sound effect without playing it.

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Identifier for the sound |
| `url` | `string` | URL of the audio file |
| `config` | `{ volume?: number; pool?: number }` | Optional config. `pool` sets how many concurrent instances. |

---

## Lifecycle

### `handleVisibility(enabled?)`

Pause/resume audio when the browser tab becomes hidden. Called automatically by `init()` unless `autoVisibility: false`.

### `destroy()`

Clean up all audio resources (AudioContext, event listeners, pooled nodes). Call when the game unmounts.

---

## Types

### `AudioManifest`

```ts
interface AudioManifest {
  music?: MusicConfig;
  sfx?: Record<string, SfxConfig>;
  autoVisibility?: boolean;  // default: true
}
```

### `MusicConfig`

```ts
interface MusicConfig {
  url: string;
  volume?: number;   // 0.0–1.0, default 1.0
  fadeIn?: number;   // seconds, default 2.0
}
```

### `SfxConfig`

```ts
interface SfxConfig {
  url: string;
  volume?: number;   // 0.0–1.0, default 1.0
  pool?: number;     // max concurrent instances, default 3
}
```
