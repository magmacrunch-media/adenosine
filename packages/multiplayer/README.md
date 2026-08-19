# @magmacrunch/adenosine-multiplayer

Game-agnostic multiplayer WebSocket client — lobby, rooms, colour picking, chat
and turn relay, plus a board-game HTML template. No runtime dependencies.

```bash
npm install @magmacrunch/adenosine-multiplayer
```

## Use

```js
import { MP, MSG, BoardGameTemplate } from '@magmacrunch/adenosine-multiplayer';

MP.onWelcome     = (data)   => console.log('joined room', data.room);
MP.onGameStarted = (data)   => startGame(data);
MP.onGameAction  = (action) => handleAction(action);

MP.connect();
MP.join('Player1', '#ff2d55');
```

`MP.sendAction({ type: 'play_card', card })` relays a move to the other players;
`MSG` holds the protocol's message-type constants and `MP_PALETTE` the colours
the lobby offers.

### Board game scaffolding

```js
document.body.innerHTML = BoardGameTemplate.render({
  title: 'CHESS',
  instructions: '<h3>Rules</h3><p>…</p>',
  credits: '<h3>Chess</h3><p>Your name here</p>',
});
```

`render()` returns markup; it does not insert it. Note that `<script>` elements
in a string assigned through `innerHTML` never execute — load your game scripts
with real tags.

## Configuration

With nothing configured, `MP.connect()` targets **the origin that served the
page**, choosing `wss:` or `ws:` from the page protocol.

```js
MP.configure({
  defaultServer: 'games.example.com/chess',   // bare host[:port][/path]
  allowlist: ['games.example.com'],           // hosts a ?server= link may name
});
```

Prefer a bare host over a `ws://`-prefixed value: a value already starting with
`ws` is used verbatim, which silently defeats protocol selection on `https:`
pages. Private ranges (RFC1918) and loopback are always allowed so LAN and dev
play keep working; anything else a `?server=` link names must be in `allowlist`,
or it is ignored and logged.

### Server — you need one, and this package is not it

This is the **client half only**. Nothing here listens; `MP.connect()` expects a
WebSocket server that keeps rooms and relays frames between the players in one.
No such server ships with this package, so a fresh install has nothing to talk to
until you provide one.

[`PROTOCOL.md`](PROTOCOL.md) specifies the whole wire format — every frame in
both directions with its fields, plus the six things a minimal server must do.
It is short, and writing a server against it is a normal afternoon's work in any
language with a WebSocket library.

## Without a bundler

Straight from a CDN — no npm, no build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-multiplayer@0.4/lobby.css">
<script src="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-multiplayer@0.4/dist/index.global.js"></script>
```

The IIFE build exposes `window.AdMP`. The version is pinned to a minor here on purpose:
an unpinned URL follows `latest` and will cross a major without warning.

Installed from npm instead, the same file is `dist/index.global.js`.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## Theming

| Property | Default | What it colours |
|---|---|---|
| `--accent` | `#00f5ff` | Borders, titles, focus |
| `--gold` | `#ffe03a` | Host badge, primary button |
| `--bg-dark` | `#060e1a` | Overlay backdrop |
| `--bg-mid` | `#1a2a44` | Panel |
| `--border` | `#1a2a44` | Dividers |
| `--cream` | `#f0ead8` | Body text |
| `--slate` | `#4a6a7a` | Muted text |
| `--font-pixel` / `--font-mono` | Press Start 2P / VT323 | Headings / body |

Glows and translucent fills derive from `--accent` and `--bg-dark` through
`color-mix`, so overriding the accent recolours them too rather than leaving a
cyan halo behind.

Derived colours use `color-mix()`, which needs Chrome 111, Safari 16.2 or
Firefox 113 — all shipped in 2023.

## Module format

ESM only. The `exports` map declares no `require` condition, so this cannot be
`require()`d from CommonJS — use `import`, or the IIFE build above.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
