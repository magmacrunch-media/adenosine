# Changelog

All notable changes to the adenosine monorepo are documented here.

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
