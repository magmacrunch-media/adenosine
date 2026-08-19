# API Reference — adenosine-multiplayer

Game-agnostic multiplayer WebSocket client with lobby and board game template.

## Table of Contents

- [MP](#mp) — Main client
- [MSG](#msg) — Message type constants
- [MP_PALETTE](#mp_palette) — Player colour palette
- [BoardGameTemplate](#boardgametemplate) — HTML template for board games
- [Types](#types)

---

## MP

The `MP` object is the main multiplayer client. Assign callbacks before calling `connect()`.

### `MP.configure(config)`

Set deployment-specific wiring. Must be called before `connect()`.

| Param | Type | Description |
|-------|------|-------------|
| `config.defaultServer` | `string` | Where `connect()` goes when called with no argument. Bare `"host[:port][/path]"` — scheme is chosen from page protocol. |
| `config.allowlist` | `readonly string[]` | Extra hosts a `?server=` override may name, on top of the page's own origin and private ranges. |

```js
AdMP.MP.configure({
  defaultServer: 'games.example.com/chess',
  allowlist: ['games.example.com'],
});
```

### `MP.connect(url?)`

Connect to the game server. With no argument, uses `defaultServer` from `configure()`.

```js
MP.connect();                    // uses configured defaultServer
MP.connect('wss://other:8769');  // explicit URL
```

### `MP.quit()`

Leave the room and clear the local name and room code. Sends a `quit` frame; the
server is expected to broadcast `player_quit` to the others.

There is no separate disconnect method — closing without telling the server leaves a ghost in
the lobby until the socket times out.

### `MP.sendAction(data)`

Send a game action to the server.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `object` | Action payload (must include `type`) |

```js
MP.sendAction({ type: 'play_card', card: { suit: 'hearts', rank: 'A' } });
```

### `MP.sendChat(text)`

Send a chat message in the current room.

### `MP.createRoom()`

Request a new room from the server. Triggers `onRoomCreated` callback.

### `MP.joinRoom(code)`

Join an existing room.

### `MP.startGame()`

Tell the server to start the game (host only).

### `MP.quit()`

Leave the current room/game.

### Getters

| Method | Returns | Description |
|--------|---------|-------------|
| `MP.getMyName()` | `string \| null` | Player name |
| `MP.getMyColor()` | `string \| null` | Player colour |
| `MP.getRoomCode()` | `string \| null` | Current room code |
| `MP.amIHost()` | `boolean` | Whether this player is the host |
| `MP.isSpectator()` | `boolean` | Whether this is a spectator connection |

### Callbacks

Assign these before calling `connect()`:

| Callback | Signature | Description |
|----------|-----------|-------------|
| `MP.onConnected` | `() => void` | Connection established |
| `MP.onDisconnected` | `() => void` | Connection lost |
| `MP.onRejected` | `(reason: string) => void` | Server rejected the connection |
| `MP.onWelcome` | `(data: MPMessage) => void` | Initial server welcome |
| `MP.onSpectatorWelcome` | `(data: MPMessage) => void` | Spectator welcome |
| `MP.onLobbyUpdate` | `(data: MPMessage) => void` | Lobby state update |
| `MP.onLobbySnapshot` | `(data: MPMessage) => void` | Full lobby snapshot |
| `MP.onGameStarted` | `(data: MPMessage) => void` | Game has started |
| `MP.onGameState` | `(state: unknown) => void` | Full game state from server |
| `MP.onGameAction` | `(action: unknown) => void` | Broadcast game action |
| `MP.onChatMessage` | `(from, text, color) => void` | Chat message received |
| `MP.onSystemMessage` | `(text: string) => void` | System message |
| `MP.onPlayerJoined` | `(data: MPMessage) => void` | Player joined the room |
| `MP.onPlayerQuit` | `(data: MPMessage) => void` | Player left the room |
| `MP.onRoomCreated` | `(code: string) => void` | New room created |
| `MP.onRoomJoined` | `(code: string) => void` | Joined a room |
| `MP.onError` | `(text: string) => void` | Error message |

---

## MSG

Message type constants to avoid magic strings.

```js
const { MSG } = AdMP;

// Client → Server
MSG.JOIN            // 'join'
MSG.CREATE_ROOM     // 'create_room'
MSG.JOIN_ROOM       // 'join_room'
MSG.SPECTATE        // 'spectate'
MSG.START_GAME      // 'start_game'
MSG.GAME_ACTION     // 'game_action'
MSG.CHAT            // 'chat'
MSG.QUIT            // 'quit'

// Server → Client
MSG.LOBBY_SNAPSHOT  // 'lobby_snapshot'
MSG.WELCOME         // 'welcome'
MSG.SPECTATOR_WELCOME // 'spectator_welcome'
MSG.REJECTED        // 'rejected'
MSG.LOBBY_UPDATE    // 'lobby_update'
MSG.GAME_STARTED    // 'game_started'
MSG.GAME_STATE      // 'game_state'
MSG.GAME_ACTION_BC  // 'game_action' (broadcast)
MSG.CHAT_MSG        // 'chat'
MSG.SYSTEM_MSG      // 'system'
MSG.PLAYER_QUIT     // 'player_quit'
```

---

## MP_PALETTE

Array of 12 player colours. Assigns colours to players in join order.

```js
const { MP_PALETTE } = AdMP;
// ['#ff2d55', '#ff7c1e', '#ffe135', '#39d353', '#6cd4f5', '#4059c8',
//  '#9b30ff', '#ff69b4', '#fff5e1', '#00fa9a', '#ff4f6d', '#7b68ee']
```

---

## BoardGameTemplate

Generates the common HTML structure for board games (lobby, game board area, game-over overlay).

### `BoardGameTemplate.render(config)`

Build and inject the page HTML. Returns nothing — modifies the DOM directly.

| Param | Type | Description |
|-------|------|-------------|
| `config` | `BoardGameConfig` | Layout configuration |

```js
const { BoardGameTemplate } = AdMP;

BoardGameTemplate.render({
  title: 'CHESS',
  subtitle: '// NEON EDITION //',
  buttons: [
    { id: 'createBtn', label: 'CREATE GAME', cls: 'primary' },
    { id: 'joinBtn', label: 'JOIN GAME' },
  ],
  gameControls: [
    { id: 'restartBtn', label: 'RESTART', icon: '⟲' },
    { id: 'quitBtn', label: 'QUIT', icon: '✕' },
  ],
  credits: 'MagmaCrunch Media',
});
```

### BoardGameConfig

```ts
interface BoardGameConfig {
  title?: string;           // game title
  subtitle?: string;        // subtitle below title
  footer?: string[];        // footer lines
  buttons?: BoardGameButton[];  // start menu buttons
  extraStart?: string;      // HTML injected after start buttons
  gameHeader?: string;      // HTML for game header area
  gameBody?: string;        // HTML for main game area
  gameControls?: BoardGameButton[];  // in-game control buttons
  instructions?: string;    // how-to-play text
  credits?: string;         // credits text
  gameOverTitle?: string;   // game-over overlay title
  gameOverMsg?: string;     // game-over overlay message
  extraHead?: string;       // HTML injected into <head>
}
```

### BoardGameButton

```ts
interface BoardGameButton {
  id: string;     // DOM element ID
  label: string;  // button text
  cls?: string;   // CSS class (e.g. 'primary')
  icon?: string;  // icon character
}
```

---

## Types

### `MPMessage`

```ts
interface MPMessage {
  type: string;
  [key: string]: unknown;
}
```

### `MPConfig`

```ts
interface MPConfig {
  defaultServer?: string;
  allowlist?: readonly string[];
}
```
