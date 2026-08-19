# API Reference — adenosine-score-client

WebSocket high-score client with localStorage fallback.

## Table of Contents

- [ScoreClient](#scoreclient) — Main client class
- [Types](#types)

---

## ScoreClient

### `new ScoreClient()`

Creates a new score client instance. Loads any pending (unsynced) saves from localStorage.

### `.auto(opts?)`

Auto-detect the admin server from `window.location`. Returns `this` for chaining.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `opts.url` | `string` | — | Full WebSocket URL. When set, all other options are ignored. |
| `opts.hostname` | `string` | `window.location.hostname` | Host to connect to. |
| `opts.port` | `number \| null` | `8781` | Port. Pass `null` to omit (for TLS proxies on 443). |
| `opts.secure` | `boolean` | matches page protocol | Force `wss:` (true) or `ws:` (false). |
| `opts.path` | `string` | `''` | Path on the host, e.g. `/scores`. |

```js
const scoreClient = new AdScore.ScoreClient().auto();
// or with options:
const scoreClient = new AdScore.ScoreClient().auto({ port: null, path: '/scores' });
```

### `.connect(url)`

Connect to a specific WebSocket URL. Returns `this` for chaining.

```js
scoreClient.connect('wss://myserver.com:8781');
```

### `.isConnected`

Read-only boolean. `true` when the WebSocket is open.

### `.load(game)`

Load scores for a game. Tries the backend first, falls back to localStorage.

| Param | Type | Description |
|-------|------|-------------|
| `game` | `string` | Game identifier (e.g. `'tetris'`) |

Returns `Promise<ScoreEntry[]>` sorted by score descending.

```js
const scores = await scoreClient.load('tetris');
// [{ initials: 'JAM', score: 12400 }, ...]
```

### `.save(game, name, score, extra?)`

Save a score. Updates localStorage immediately; syncs to backend when connected (or queues for later).

| Param | Type | Description |
|-------|------|-------------|
| `game` | `string` | Game identifier |
| `name` | `string` | Player initials (auto-truncated to 3 chars, uppercased) |
| `score` | `number` | Score value |
| `extra` | `Record<string, unknown>` | Optional metadata (e.g. `{ level: 5 }`) |

Returns `Promise<SaveResult>`:

| Field | Type | Description |
|-------|------|-------------|
| `rank` | `number` | 1-based position among all known scores |
| `synced` | `boolean` | `true` if saved to backend, `false` if queued |

```js
const result = await scoreClient.save('tetris', 'JAM', 12400, { level: 5 });
console.log(result.rank); // 1
```

### `.loadAll()`

Load all game scores (admin dashboard use). Returns `Promise<Record<string, { game: string; scores: ScoreEntry[] }>>`.

### `.reset(game)`

Clear scores for a game (both localStorage and backend).

### `.onMessage(fn)`

Register a listener for incoming WebSocket messages. Returns an unsubscribe function.

```js
const unsub = scoreClient.onMessage((data) => {
  console.log('server message:', data);
});
unsub(); // stop listening
```

---

## Types

### `ScoreEntry`

```ts
interface ScoreEntry {
  initials: string;
  score: number;
  [key: string]: unknown;  // extra metadata
}
```

### `SaveResult`

```ts
interface SaveResult {
  rank: number;    // 1-based position
  synced: boolean; // true if saved to backend
}
```

### `ScoreClientOptions`

```ts
interface ScoreClientOptions {
  url?: string;
  hostname?: string;
  port?: number | null;
  secure?: boolean;
  path?: string;
}
```
