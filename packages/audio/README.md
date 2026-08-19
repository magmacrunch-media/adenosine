# @magmacrunch/adenosine-audio

Web Audio engine for looping game music and pooled sound effects — fades,
muting, and pausing with tab visibility. No runtime dependencies.

```bash
npm install @magmacrunch/adenosine-audio
```

## Use

```js
import * as AdAudio from '@magmacrunch/adenosine-audio';

await AdAudio.init({
  music: { url: 'audio/theme.ogg', volume: 0.4, fadeIn: 2.0 },
  sfx: {
    deal: { url: 'audio/deal.wav', volume: 0.8, pool: 4 },
    win:  { url: 'audio/win.wav' },
  },
});

// Browsers require a user gesture before audio may start.
playButton.addEventListener('click', () => AdAudio.playMusic());

AdAudio.playSfx('deal');
AdAudio.toggleMusicMute();
AdAudio.handleVisibility(true);   // pause music while the tab is hidden
```

`pool` pre-allocates buffer sources so a rapidly repeated effect does not cut
itself off.

## Without a bundler

```html
<script src="adenosine-audio.js"></script>
<script>AdAudio.init({ music: { url: 'theme.ogg' } });</script>
```

The IIFE build is `dist/index.global.js` and exposes `window.AdAudio`.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
