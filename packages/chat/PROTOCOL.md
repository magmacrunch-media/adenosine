# Wire protocol

`adenosine-chat` is the **client half**. It speaks JSON frames over a plain
WebSocket and expects a server that holds a global room, named sub-rooms, and a
roster of who is connected. This document specifies that server's side so you can
write your own.

Every frame is a JSON object with a `type` field. There is no handshake or
authentication layer — the socket carries JSON text messages and nothing else.

The widget holds its socket in a `SharedWorker` so one connection is shared
across tabs and survives navigation. That is invisible to the server: it sees one
ordinary WebSocket.

---

## Client → server

| `type` | Fields | Meaning |
|---|---|---|
| `set_name` | `name` | Claim a display name. Sent on connect and whenever the user renames. |
| `set_color` | `color` (or `null`) | Claim a name colour. `null` asks the server to pick. |
| `chat` | `text` | Send a message to the global room. |
| `join_room` | `room` | Join a named sub-room. |
| `leave_room` | `room` | Leave it. |
| `typing` | — | The user is typing. The server is expected to fan this out to others. |

Note there is **no `room` field on `chat`**. A client sends to whichever room it
most recently joined; routing is server-side state, not per-message.

## Server → client

| `type` | Fields | Effect on the widget |
|---|---|---|
| `chat` | `from`, `color`, `text` | Appends to the global transcript and bumps the unread badge |
| `room_chat` | `from`, `color`, `text` | Appends to the room transcript |
| `history` | `messages[]` | Replays the global backlog; each entry has the `chat` shape |
| `room_history` | `messages[]` | Replays a room's backlog |
| `name_assigned` | `name` | Sets the user's name and persists it to `localStorage` |
| `user_list` | `users[]`, `count` | Redraws the roster; also how a user learns their own assigned colour |
| `global_users` | `count` | Updates the online count only |
| `typing` | `from`, `room` | Shows the typing indicator |
| `status` | — | Accepted and ignored; free for server-side use |

A message — in `chat`, `room_chat`, or inside a `history` array — renders from
three fields: `from`, `color` and `text`. A `from` of exactly `system` is styled
as a system notice rather than a user line.

Each entry in `user_list.users` is:

```ts
{ name: string; color?: string; game?: string; rooms?: string[] }
```

`game` marks a user as being inside a game rather than the global room, and
`rooms` lists the room codes they have joined. Both are optional.

The widget learns its own colour by finding its own `name` in `user_list.users`,
so a server that assigns colours must include the recipient in that roster.

An unrecognised `type` falls through the switch and is ignored.

---

## What a minimal server must do

1. **Accept a socket.** The widget connects as soon as `ChatWidget.connect()`
   runs, before any user action.
2. **Answer with `name_assigned`** if you assign or normalise names — otherwise
   the widget keeps whatever it restored from `localStorage`.
3. **Broadcast `chat` to everyone** on receiving a `chat`, including the sender,
   since the widget does not echo its own messages locally.
4. **Send `user_list` whenever the roster changes**, and include the recipient in
   it — that is the only way a client discovers its own assigned colour.
5. **Optionally send `history`** on connect so a new tab has context.

## Scheme and hosting

`connect()` chooses `wss:` or `ws:` from the page protocol, because a browser
blocks a `ws:` socket opened from an `https:` page as mixed content before it
reaches the network. If your server has no TLS of its own, put it behind a
reverse proxy that terminates TLS and point `server` at the proxy — see the
configuration section in [`README.md`](README.md).

Loopback and RFC1918 addresses stay on `ws:` deliberately, so LAN and development
servers work without certificates.
