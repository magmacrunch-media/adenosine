# Changelog — `@magmacrunch/adenosine-chat`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

## 0.6.0 — 2026-09-05

Both changes are about the online count meaning *people who are here*. 0.5.1
stopped it reporting users who had disconnected; this stops it reporting users
who never arrived, and users who have wandered off.

### Changed

- **A visitor who never joins in is no longer on the roster.** `set_name` used
  to go out on every connect, so merely loading a page registered somebody as a
  `PlayerNN` and the count measured page loads rather than participants. It is
  now sent when the visitor actually joins in — sends a message, joins a room,
  picks a name or a colour. Anything the server gates behind having a session
  registers first, so `joinRoom()` on a lurker is no longer silently dropped.
- **`user_list.count` is now people present, not people connected.** `users`
  still carries everyone, each with an `away` flag. Away entries render greyed
  and labelled `Away`.

### Added

- **`presence` (client → server).** The widget reports `away` when its page is
  hidden, or visible but untouched for ten minutes, and `here` when it comes
  back. Nothing below the page can tell: WebSocket ping/pong is answered by the
  browser's network stack whether or not anybody is looking, so a backgrounded
  tab on a pocketed phone counted as present indefinitely.

  With a SharedWorker the aggregate is computed in the worker — one socket
  carries every tab, so one hidden tab is not an absent person, and any page
  saying `here` wins. The worker re-announces on each socket open, since a
  reconnect is a new session to the server.

  Transitions only, and a server that does not implement it is unaffected. A
  client that never sends it is never away, so older widgets behave as before.

## 0.5.1 — 2026-09-05

### Fixed

- **The online count no longer outlives the connection.** It is written by
  `user_list` and by nothing else, and a dropped socket produces no frame — so
  the widget went on displaying the last number it had heard, indefinitely,
  beside a header it had just marked `disconnected`. Both transports were
  affected: the SharedWorker path and the per-page socket used when
  SharedWorker is unavailable. Both now retract the roster, showing an em dash
  rather than `0` — zero is a claim about the server, and a widget that cannot
  see the server has no standing to make one.

### Removed

- **`global_users`.** It carried a count of sockets rather than people and was
  written into the same counter as `user_list`, so whichever frame arrived last
  decided the number and anyone with two tabs open was counted twice. The
  arcade's server had it as dead code and has now dropped it; `user_list` is the
  only online count. See `PROTOCOL.md`.

## 0.5.0 — 2026-08-29

### Changed

- Removed an `el()` helper nothing called (two functions shadowed it with their own `var el`) and an `activeTab` variable written in two places and read in none. `showTyping`'s unused `room` parameter renamed `_room` — the widget renders one merged list, so a typing notice is not room-scoped, the same reason `_target` on `addMessage` is unused.

### Changed — packaging

- `dist/index.global.js` is now a declared export (`./global`) with `unpkg` and
  `jsdelivr` fields, so the bundle the browser tools load off the CDN is named
  in the manifest instead of merely existing at a known path.
- `CHANGELOG.md` now ships in the tarball.
- Dead `.d.ts.map` files are gone. They pointed at a `src/` the tarball has
  never included, so an editor's go-to-definition followed them nowhere.

## 0.4.4 — 2026-08-27

### Security

A peer could run script in every other participant's page; `0.4.3` is affected.

`escapeHtml` escaped by assigning to `textContent` and reading `innerHTML`
back, which never escapes a double quote — a text node has no need of one. The
result went into a double-quoted attribute, so a peer-chosen colour of
`red" onmouseover="alert(1)` closed the attribute and opened an event handler.
Colour is not the page's to choose: the widget broadcasts it to everyone else.

Both render paths now build nodes through the DOM — `createElement`,
`textContent`, `.style.color` — so there is no seam for a quote to sit in.
`escapeHtml` had no callers left and is gone.

## Earlier releases

`0.4.3`, `0.4.2`, `0.4.1`, `0.4.0`, `0.3.1`, `0.3.0`, `0.2.1`, `0.2.0`

Descriptions for these are in the [monorepo changelog](../../CHANGELOG.md).
They are not restated here rather than restated approximately.
