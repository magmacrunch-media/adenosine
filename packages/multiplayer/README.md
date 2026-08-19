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

```html
<link rel="stylesheet" href="lobby.css">
<script src="adenosine-multiplayer.js"></script>
<script>
  AdMP.MP.configure({ defaultServer: 'games.example.com/chess' });
  AdMP.MP.connect();
</script>
```

The IIFE build is `dist/index.global.js` and exposes `window.AdMP`.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
