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
| `presence` | `state` | `here` or `away`. Whether anybody is actually at the pages holding this session. |

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
| `user_list` | `users[]`, `count` | Redraws the roster; also how a user learns their own assigned colour. `count` is people **here**, `users` is everyone connected |
| `typing` | `from`, `room` | Shows the typing indicator |
| `status` | — | Accepted and ignored; free for server-side use |

`global_users` was removed in 0.5.1. It carried a count of sockets rather than
people and was written into the same counter as `user_list`, so whichever frame
arrived last decided the number — and a second tab counted twice. The roster in
`user_list` is the only online count; a server should send that and nothing else.

A message — in `chat`, `room_chat`, or inside a `history` array — renders from
three fields: `from`, `color` and `text`. A `from` of exactly `system` is styled
as a system notice rather than a user line.

Each entry in `user_list.users` is:

```ts
{ name: string; color?: string; game?: string; rooms?: string[]; away?: boolean }
```

## Who is on the roster, and who is counted

Two rules, both added in 0.6.0, and both about the count meaning *people*.

**`set_name` is what puts you on the roster, and the widget holds it back**
until the visitor does something — sends a message, joins a room, picks a name
or a colour. It used to be sent on every connect, so merely loading a page
registered a `PlayerNN` and the count measured page loads. A server should
expect sockets that never name themselves: they still receive history, status
and the roster, and are simply not in it.

**`presence` is the only way to know somebody is actually there.** The
liveness check underneath is WebSocket ping/pong, which the browser's network
stack answers without waking the page — a backgrounded tab on a pocketed phone
looks exactly like somebody at the keyboard. The widget sends `away` when the
page is hidden, or visible but untouched for ten minutes, and `here` when it
comes back. It sends transitions only, and a client that never sends it is
never away, so an older widget behaves as it always did.

With a SharedWorker the aggregate is computed in the worker, not the page: one
socket carries every tab, so a single hidden tab is not an absent person. Any
page saying `here` makes the session `here`. The worker re-announces on every
socket open, because a reconnect is a new session as far as the server knows.

An away user stays in `users` with `away: true` and drops out of `count`. The
widget greys them and labels them `Away` — they are still in the room, just not
at it.

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
