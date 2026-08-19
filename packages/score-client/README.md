# @magmacrunch/adenosine-score-client

WebSocket high-score client with a localStorage fallback and an offline queue —
scores saved while disconnected sync when the socket returns. No runtime
dependencies.

```bash
npm install @magmacrunch/adenosine-score-client
```

## Use

```js
import { ScoreClient } from '@magmacrunch/adenosine-score-client';

const client = new ScoreClient().auto();

const scores = await client.load('tetris');
const { rank, synced } = await client.save('tetris', 'JAM', 12400, { level: 5 });
```

`synced: false` means the score is queued locally and will be sent on reconnect,
so a scoreboard still works with no server at all.

## Configuration

`auto()` connects to the page's own hostname on port 8781, choosing `wss:` or
`ws:` from the page protocol — an `https:` page cannot open a `ws:` socket, as
browsers block it as mixed content before it reaches the network.

```js
new ScoreClient().auto({
  hostname: 'scores.example.com',
  port: null,        // omit the port — for a TLS proxy fronting the socket on 443
  path: '/scores',
});

new ScoreClient().connect('wss://scores.example.com/scores');  // bypass entirely
```

## Without a bundler

Straight from a CDN — no npm, no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-score-client@0.2/dist/index.global.js"></script>
```

The IIFE build exposes `window.AdScore`. The version is pinned to a minor here on purpose:
an unpinned URL follows `latest` and will cross a major without warning.

Installed from npm instead, the same file is `dist/index.global.js`.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## Module format

ESM only. The `exports` map declares no `require` condition, so this cannot be
`require()`d from CommonJS — use `import`, or the IIFE build above.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
