# API Reference — adenosine-chat

Floating real-time chat widget backed by a SharedWorker.

## Table of Contents

- [ChatWidget](#chatwidget) — Static API
- [Types](#types)

---

## ChatWidget

All methods are static on the `ChatWidget` object.

### `ChatWidget.connect(opts?)`

Connect to the chat server. Opens a SharedWorker that holds a single WebSocket across page navigations.

| Param | Type | Description |
|-------|------|-------------|
| `opts.workerUrl` | `string` | Override the SharedWorker URL. Auto-detected from the loading script otherwise. |
| `opts.server` | `string` | Chat server address. Accepts `"host[:port][/path]"` or a full `ws://`/`wss://` URL. Defaults to the page's own origin. |
| `opts.allowlist` | `readonly string[]` | Extra hosts a `?server=` override may name, on top of the page's own origin. |

```js
// Default — connects to the page's own origin
ChatWidget.connect();

// Custom server
ChatWidget.connect({
  server: 'chat.example.com:8768',
  allowlist: ['chat.example.com'],
});
```

### `ChatWidget.disconnect()`

Disconnect from the chat server and remove the widget from the DOM.

### `ChatWidget.joinRoom(code)`

Join a game-specific chat room. Users in a room see only room messages.

| Param | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room identifier (e.g. `'chess-abc123'`) |

### `ChatWidget.leaveRoom(code)`

Leave a game-specific room and return to the global chat.

### `ChatWidget.setName(name)`

Set the display name shown in chat.

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name (stored in localStorage) |

### `ChatWidget.setColor(color)`

Set the name colour shown in chat.

| Param | Type | Description |
|-------|------|-------------|
| `color` | `string` | CSS colour string (e.g. `'#ff2d55'`) |

### `ChatWidget.getMyName()`

Returns `string | null` — the current display name.

### `ChatWidget.getMyColor()`

Returns `string | null` — the current name colour.

---

## Types

### `ConnectOptions`

```ts
interface ConnectOptions {
  workerUrl?: string;
  server?: string;
  allowlist?: readonly string[];
}
```

### `ChatMessage`

```ts
interface ChatMessage {
  type: string;
  [key: string]: unknown;
}
```

### `OnlineUser`

```ts
interface OnlineUser {
  name: string;
  color?: string;
  game?: string;    // set when inside a game room
  rooms?: string[]; // joined room codes
}
```

---

## Architecture

```
Page (browser) ──postMessage──▶ SharedWorker ──WebSocket──▶ chat-server.py
     │                              │
     └── sendToServer() ────────────┘
```

- **SharedWorker** holds one WebSocket across all page navigations, preventing duplicate users.
- **Session tokens** stored in `localStorage` (`adenosine_chat_session`).
- **CSS** is in `chat-widget.css` — must be linked before the script.

## CSS

```html
<link rel="stylesheet" href="adenosine-chat.css">
```

The widget creates its own DOM. No manual HTML needed.
