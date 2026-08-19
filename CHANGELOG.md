# Changelog

All notable changes to the adenosine monorepo are documented here.

## [Unreleased — relicense and de-hardcode] — 2026-08-18

Released: `chat` 0.4.0, `multiplayer` 0.4.0, and patch bumps to `rpg` 0.2.1,
`puzzle` 0.2.2, `audio` 0.2.2, `score-client` 0.2.3.

### Licence

- **Relicensed from LGPL-2.1 to Apache-2.0.** LGPL's relinking requirement is
  written for C shared libraries and maps poorly onto bundled browser JS, it
  does not actually compel credit, and it narrowed who could adopt these
  packages. Apache-2.0 is permissive, grants patent rights explicitly, and its
  `NOTICE` file is the standard way for credit to travel downstream. Every
  package now ships its own `LICENSE` and `NOTICE` — npm does not inherit the
  monorepo root's, so previously no tarball carried a licence at all.

### Breaking — `chat` and `multiplayer` no longer connect to magmacrunch

Both packages hardcoded `magmacrunch.duckdns.org`, `magmacrunch.com` and
`192.168.1.16` as their connection fallbacks *and* their `?server=` allowlists.
Anyone who installed `adenosine-chat` and called `ChatWidget.connect()` — the
example in our own README — opened a socket to a Raspberry Pi they had never
heard of, and the widget replayed their users' saved chat credentials to it.

With nothing configured, both now target **the origin that served the page**.

- `MP.configure({ defaultServer, allowlist })` — new. `MP_DEFAULT_SERVER` still
  works.
- `ChatWidget.connect({ server, allowlist })` — `connect()` previously took only
  `workerUrl`.
- The `?server=` allowlist now defaults to the page's own origin, loopback and
  the private ranges. Other hosts must be declared.
- `BoardGameTemplate.render()` no longer defaults its credits block to a
  specific studio; with no `credits` it emits just the title.

**Upgrading:** a deployment whose server is not the page's own origin must now
say so. See each package's README.

### Changes

- Every package has a README; six npm pages were blank.
- New `scripts/check-no-hardcoded-hosts.mjs`, wired into CI, fails if any
  package names a deployment hostname or LAN address again. Ports are
  deliberately not banned: a default port resolves against the page's own
  hostname and so cannot reach anyone else's machine.
- `check-packaging.mjs` now also asserts `LICENSE` and `NOTICE` ship.
- Documentation fixes: `AdAudio.handleVisibility` takes a boolean, not
  `{ pauseMusic }`; `HandEvaluator` is a class, so `new HandEvaluator().evaluate()`.

## [0.4.0 / 0.3.1] — 2026-08-18

Released together: `cards` 0.4.0, `chat` and `multiplayer` 0.3.1.

### Bug fixes

- **adenosine-cards**: `deck.js` called `getAceHTML()` without importing it, so
  `Card.getHTML()` threw for every face-up ace. Number and face cards were
  unaffected, which is why it went unnoticed — solitaire, cribbage, Sökö and
  Texas Hold'Em Lava Dome all failed to draw an ace. This is the third bug of
  this exact shape in that one file (see 0.2.2 and 0.2.1); the TypeScript port
  below is what surfaced it, and prevents a fourth.

### Changes

- **adenosine-cards**, **adenosine-chat**, **adenosine-multiplayer** ported from
  JavaScript to TypeScript. Each previously shipped a hand-written
  `src/index.d.ts` describing its intended surface; that contract is now derived
  from the implementation and checked by `tsc`. Card `Suit`, `Rank`, `HandName`
  and the cribbage/poker result shapes are exported types rather than prose.
- **adenosine-chat**, **adenosine-multiplayer**: `types` now points at the
  generated `dist/index.d.ts`. The 0.3.0 tarballs were built before the port and
  shipped the stale hand-written declarations, so consumers on 0.3.0 typecheck
  against a contract that is no longer maintained. 0.3.1 carries no runtime
  change beyond the rebuild — upgrading is only worthwhile for the types.
- **adenosine-multiplayer**, **adenosine-audio**: first tests for the two
  packages that had none. `multiplayer` had no `test` script at all, so the root
  `npm test` was silently skipping it.

## [0.3.0] — 2026-08-17

### New packages

- **adenosine-chat** — floating real-time chat widget backed by a SharedWorker.
  Provides `ChatWidget` global with `.connect()`, `.disconnect()`, `.joinRoom()`,
  `.setName()`, `.setColor()`, and room management.

- **adenosine-multiplayer** — multiplayer WebSocket client with lobby, chat, and
  `BoardGameTemplate` for board games (SORRY, backgammon, checkers, chess, etc.).
  Provides `MP`, `MSG`, `MP_PALETTE` globals.

### Changes

- WebSocket protocol auto-detection: score-client, chat, and multiplayer now pick
  `ws://` or `wss://` from the page protocol instead of hardcoding.
- `BoardGameTemplate.render()` builds markup only (no longer injects into DOM
  directly), giving games control over where the board goes.
- Chat: SharedWorker file is now shipped correctly and found after tsup bundling.

## [0.2.2] — 2026-08-15

### Bug fixes

- **adenosine-cards**: Fixed missing imports in `deck.js` (`FACE_CARD_SVG`,
  `getNumberCardHTML`) that broke several card games.
- **adenosine-score-client**: Score replies now echo `_id` so clients can match
  requests to responses.

### Packaging

- Each package now ships the files it claims in its `files` field, fixing root
  build scripts that relied on those artifacts.

## [0.2.1] — 2026-08-14

### New package

- **adenosine-audio** — Web Audio API music and sound effects engine. Provides
  `AdAudio` global with `init()`, `playMusic()`, `playSfx()`, `handleVisibility()`,
  `toggleMusicMute()`, `toggleSfxMute()`, `destroy()`.

### Changes

- Audio: `setValueAtTime` for instant `rampTime=0` in `setMusicMuted` (Web Audio
  API requirement).

## [0.2.0] — 2026-08-10

Initial release of the `@magmacrunch` scoped packages.

### Packages

| Package | Description |
|---------|-------------|
| `@magmacrunch/adenosine-rpg` | 2D tile-based RPG engine (game loop, input, state) |
| `@magmacrunch/adenosine-puzzle` | Sliding tile puzzle framework |
| `@magmacrunch/adenosine-cards` | Card deck, pixel-art SVG rendering, chips, hand evaluators |
| `@magmacrunch/adenosine-score-client` | WebSocket high-score client with localStorage fallback |
| `@magmacrunch/adenosine-audio` | Web Audio music + SFX engine |

All packages ship both ESM (for npm) and IIFE (for `<script>` tags) builds.
