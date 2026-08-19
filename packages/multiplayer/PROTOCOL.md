# Wire protocol

`adenosine-multiplayer` is the **client half**. It speaks JSON frames over a
plain WebSocket and expects a server that keeps rooms and relays messages between
the players in one. This document specifies that server's side of the
conversation so you can write your own.

Every frame is a JSON object with a `type` field naming one of the constants in
`MSG`. All other fields are per-type and listed below. There is no framing,
handshake, or authentication layer — the socket carries JSON text messages and
nothing else.

The reference implementation these shapes were taken from is the arcade's
`server_base.py`, which nine games share.

---

## Client → server

| `type` | Fields | Meaning |
|---|---|---|
| `join` | `name`, `color`, `room` (or `null`) | Join a room. With `room: null` the server picks or creates one. |
| `create_room` | `name`, `color`, `room` | Create a room with this specific code. |
| `join_room` | `name`, `color`, `room` | Join an existing room by code. |
| `spectate` | `name`, `room` (or `null`) | Watch without occupying a player slot. |
| `start_game` | — | Begin play. Host only; the server should ignore it from anyone else. |
| `game_action` | `action` | One move. The server does not interpret `action`; it is your game's own shape. |
| `chat` | `text` | Send a lobby/in-game chat line. |
| `quit` | — | Leave the room. |

`name` should be treated as untrusted and length-capped by the server — the
reference caps it at 20 characters. `color` is a request, not a guarantee: the
server assigns the final colour and reports it back in `welcome.chosenColor`.

## Server → client

| `type` | Fields | Triggers |
|---|---|---|
| `welcome` | `playerName`, `room`, `isHost`, `chosenColor`, `playerCount`, `maxPlayers` | `onWelcome`, then `onRoomJoined` |
| `spectator_welcome` | `playerName`, `room` | `onSpectatorWelcome`, then `onRoomJoined` |
| `rejected` | `reason` | `onRejected(reason)` |
| `lobby_snapshot` | `rooms[]` — each `{ code, players, maxPlayers, started }` | `onLobbySnapshot` |
| `lobby_update` | `players[]`, `takenColors`, `playerCount`, `maxPlayers`, `canStart`, `gameStarted` | `onLobbyUpdate` |
| `game_started` | `colorMap`, `state` | `onGameStarted` |
| `game_state` | `state` | `onGameState(state)` — note it receives `state`, not the frame |
| `game_action` | `action` | `onGameAction(action)` — likewise, just `action` |
| `chat` | `from`, `color`, `text` | `onChatMessage(from, text, color)` |
| `system` | `text` | `onSystemMessage(text)` |
| `player_quit` | `playerName`, `color` | `onPlayerQuit` |

Each entry in `lobby_update.players` is
`{ name, color, isHost, slot }`, where `slot` is a stable per-seat colour or
`null` beyond the seat count.

An unrecognised `type` is logged and ignored by the client, so adding your own
frames is safe but they will not reach any callback.

### One subtlety: two names, one wire value

`MSG` has 19 constants but only 17 distinct wire strings. Two pairs collide
deliberately:

| Constants | Wire value |
|---|---|
| `MSG.GAME_ACTION`, `MSG.GAME_ACTION_BC` | `game_action` |
| `MSG.CHAT`, `MSG.CHAT_MSG` | `chat` |

The second name in each pair exists to make the *direction* readable in client
code, not to change the frame. A server therefore cannot tell a client's
`game_action` from its own broadcast by type alone — direction is implied by
which socket the frame arrived on. Do not treat `GAME_ACTION_BC` as a separate
message to handle.

---

## What a minimal server must do

1. **Accept a socket and wait.** The client sends nothing until the host app calls
   `MP.join()`, `MP.createRoom()`, `MP.joinRoom()` or `MP.spectate()`.
2. **Answer a join with `welcome`.** Until that arrives the client has no name,
   room or host flag — `MP.getMyName()`, `MP.getRoomCode()` and `MP.amIHost()`
   all read from it. Send `rejected` with a `reason` instead when the room is
   full or the code is taken.
3. **Broadcast `lobby_update` on every membership or colour change**, to everyone
   in the room. The lobby UI is driven entirely by this frame.
4. **On `start_game` from the host, broadcast `game_started`** to the room.
5. **Relay `game_action`.** Take the client's `action`, apply it to your
   authoritative state if you keep one, and broadcast the result as
   `game_action` (and/or a full `game_state`). The client treats both as opaque.
6. **Broadcast `player_quit` and a fresh `lobby_update` on disconnect**, whether
   the client sent `quit` or the socket simply dropped.

Two behaviours in the reference implementation are worth copying because the
client's UI assumes them: a player joining a room whose game has already started
is silently converted to a spectator (answered with `spectator_welcome` rather
than `rejected`), and the room is deleted once its last player and spectator have
gone.

## Scheme and hosting

`MP.connect()` chooses `wss:` or `ws:` from the page protocol, because a browser
blocks a `ws:` socket opened from an `https:` page as mixed content before it
reaches the network. If your server has no TLS of its own, put it behind a
reverse proxy that terminates TLS, and point `defaultServer` at the proxy — see
the configuration section in [`README.md`](README.md).

Loopback and RFC1918 addresses stay on `ws:` deliberately, so LAN and development
servers work without certificates.
