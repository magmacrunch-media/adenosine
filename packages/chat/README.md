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

### Server — you need one, and this package is not it

This is the **client half only**. The widget speaks JSON frames over a WebSocket
and expects a server that echoes each message to everyone in a room. No such
server ships here, so a fresh install renders the widget and shows it as
disconnected until you provide one.

[`PROTOCOL.md`](PROTOCOL.md) specifies the whole wire format — six frames out,
nine in, with their fields — plus the five things a minimal server must do.

## Without a bundler

Straight from a CDN — no npm, no build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-chat@0.4/chat-widget.css">
<script src="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-chat@0.4/dist/index.global.js"></script>
```

The IIFE build exposes `window.AdChat`. The version is pinned to a minor here on purpose:
an unpinned URL follows `latest` and will cross a major without warning.

Installed from npm instead, the same file is `dist/index.global.js`.

### The SharedWorker will not load from a CDN

This is the one thing to know before reaching for the CDN line above. A
`SharedWorker` may only be constructed from a **same-origin** URL — the browser
refuses a cross-origin one outright, whatever CORS headers the host sends:

```
new SharedWorker('https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-chat@0.4/dist/chat-worker.js')
→ SecurityError: Script at '…' cannot be accessed from origin 'https://yoursite.example'
```

The widget resolves `chat-worker.js` as a sibling of whatever script loaded it,
so a CDN load always lands cross-origin. It catches the failure and falls back to
a per-tab socket, which works — but the shared connection is the reason this
package exists, so you would be running it with its point removed and no error
to tell you.

Serve `chat-worker.js` from your own origin and name it:

```js
ChatWidget.connect({ workerUrl: '/js/chat-worker.js' });
```

Copy it out of `node_modules/@magmacrunch/adenosine-chat/dist/chat-worker.js` at
build time. Without it you get one socket per tab instead of one per browser,
and the transcript restarts on every navigation.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## Theming

The widget ships one accent and a small set of neutrals. Override on any
ancestor; everything derived — glows, hover tints — follows through `color-mix`.

| Property | Default | What it colours |
|---|---|---|
| `--acw-accent` | `#ff2e9c` | Borders, buttons, your own name |
| `--acw-accent-hover` | `#ff5ab5` | Hover state |
| `--acw-online` | `#39ff6e` | Connected indicator, online list |
| `--acw-ink-on-accent` | `#0a0612` | Text drawn on the accent |
| `--acw-bg` / `--acw-bg-panel` / `--acw-bg-input` | `#1a1028` / `#150b29` / `#0f0a1a` | Surfaces |
| `--acw-border` | `#3a2d5c` | Panel borders |
| `--acw-text` / `--acw-text-dim` / `--acw-text-muted` | `#f0f8ff` / `#8a7fa8` / `#5a5a6a` | Text tiers |
| `--acw-cream` | `#f0ead8` | Cream highlight |

```css
/* One line retints the widget, glows included. */
body { --acw-accent: #4dd0ff; }
```

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
