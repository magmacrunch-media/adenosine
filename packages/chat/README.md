# @magmacrunch/adenosine-chat

Floating real-time chat widget. Holds one WebSocket in a `SharedWorker`, so the
connection and scrollback survive page navigation instead of reconnecting on
every load. Falls back to a per-page socket where `SharedWorker` is unavailable.
No runtime dependencies.

```bash
npm install @magmacrunch/adenosine-chat
```

## Use

```html
<link rel="stylesheet" href="chat-widget.css">
<script type="module">
  import { ChatWidget } from '@magmacrunch/adenosine-chat';
  ChatWidget.connect();
</script>
```

`ChatWidget.connect()`, `.disconnect()`, `.joinRoom(code)`, `.leaveRoom(code)`,
`.setName(name)`, `.setColor(color)`, `.getMyName()`, `.getMyColor()`.

## Configuration

With no options, the widget connects to **the origin that served the page**,
matching the page protocol.

```js
ChatWidget.connect({
  server: 'chat.example.com',          // or a full wss:// URL
  allowlist: ['chat.example.com'],     // hosts a ?server= link may name
});
```

`allowlist` is a security control, not convenience. The widget replays saved
credentials as soon as its socket opens, so an unrestricted `?server=` override
would let a crafted link hand a visitor's identity to any host. Only the page's
own origin, loopback, and hosts you list here are accepted.

### Server

This package is the client half. It speaks JSON frames over a WebSocket and
expects a server that echoes messages to a room; the arcade's implementation
lives in the magmacrunch.com repository rather than here.

## Without a bundler

```html
<link rel="stylesheet" href="chat-widget.css">
<script src="adenosine-chat.js"></script>
<script>AdChat.ChatWidget.connect();</script>
```

The IIFE build is `dist/index.global.js` and exposes `window.AdChat`. The
`SharedWorker` file is located relative to the tag that loaded the bundle, so
`chat-worker.js` must sit beside it — cache-busting query strings are fine.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
