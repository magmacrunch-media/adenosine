# Changelog

All notable changes to the adenosine monorepo are documented here.

## [docs correction] — 2026-08-19

`puzzle`, `cards` and `multiplayer` patched. **The API references shipped
yesterday documented methods that do not exist.**

`puzzle/API.md` listed five `PuzzleGame` methods — `.shuffle()`, `.move()`,
`.isSolved()`, `.getState()`, `.onStateChange()` — and none of them were real,
while all eighteen actual methods went unmentioned. It also carried a
hand-written `interface PuzzleGame` block declaring the same fiction, and
documented `PuzzleGrid.findEmpty/canMove/move/shuffle` and a scoring API of
`.start()/.getMoves()/.getTime()/.end()`, none of which exist either.

`cards/API.md` named `Card.getID()`, `Deck.draw(count)`, `Deck.reset()` and
`CribbageHandEval.score()`. The real surface is `Card.flip()`, `Deck.deal()`,
`Deck.createDeck()` and `CribbageHandEval.scoreHand()`.

`multiplayer/API.md` documented `MP.disconnect()`; the method is `MP.quit()`.

All corrected against the built bundles. `scripts/check-api-docs.mjs` now
resolves every name an API.md writes as a call — against module exports, class
prototypes and the objects `create*()` factories return — and CI fails if one is
missing. It confirms 146 documented names across the seven packages.

Also new: `examples/`, one page per package that loads its IIFE bundle and
asserts what its README claims, reporting PASS or FAIL in the tab title. It is
what surfaced the puzzle errors, and it gives regressions somewhere to appear
other than a live game.

## [docs — make the packages adoptable] — 2026-08-19

Patch bumps across all seven. No runtime change; this release is documentation
that previously existed but never reached anyone who installed from npm.

### API reference now ships

All seven `API.md` files existed in the repo and **none of them published** — npm
auto-includes README and LICENSE but nothing else, and no package listed `API.md`
in `files[]`. So the detailed reference, including the note in cards that poker
callers must restamp aces, only ever existed for people reading the repo. That
note documents the contract whose absence caused two live scoring bugs.

`scripts/check-packaging.mjs` now fails if any package omits it.

### The wire protocols are written down

`chat` and `multiplayer` are client halves — they expect a server that this
project does not publish. Until now the only specification of what that server
must do was the client source, so writing one meant reverse-engineering
`MSG` and the message handler.

Both packages now ship a `PROTOCOL.md` giving every frame in both directions with
its fields, and what a minimal server has to do: 17 frames for multiplayer, 13
for chat. Both READMEs now say plainly that a server is required and does not
come with the package, instead of a passing mention that the arcade's servers
live elsewhere.

One subtlety documented for the first time: `MSG` has 19 constants but only 17
distinct wire values, because `GAME_ACTION`/`GAME_ACTION_BC` and `CHAT`/`CHAT_MSG`
are aliases. A server cannot tell direction from the type alone.

## [cards 0.7.0] — 2026-08-19

### Bug fixes

- **adenosine-cards**: poker graded aces as the *lowest* card in the deck. A
  royal flush scored as an ordinary flush, A-K-Q-J-10 was not recognised as a
  straight at all, and a pair of aces lost to a pair of twos.

  The cause was a mismatch between two halves of the package that had never
  agreed: `HandEvaluator` was written for ace-high (the dead branch in
  `_isStraight` testing `values[4] === 14` is the fossil), while `Card` stamps
  the ace-low `RANK_VALUES` where an ace is 1. The wheel (A-2-3-4-5) worked by
  accident, because with A=1 the run is consecutive.

  Fixed without disturbing ace-low games: `Card.value` still stamps A=1, which
  is what cribbage's fifteens and solitaire's foundations need. Poker callers
  now have `POKER_RANK_VALUES` (A=14) and `pokerValue(rank)` to restamp with.

### Breaking-ish — the evaluator's contract, stated

`HandEvaluator.evaluate()` reads `value` off the cards it is handed and never
rewrites it. That is deliberate — it is how one evaluator serves both ace-low
and ace-high games — but it means **dealing straight from a `Deck` into a poker
`evaluate()` is a bug**. Restamp at the single point where cards enter play:

```js
const card = deck.deal();
card.value = POKER_RANK_VALUES[card.rank];
```

This has now recurred twice by being remembered at some deal sites and not
others, so it is written down in `API.md` as well.

### New exports

- `POKER_RANK_VALUES` — ace-high rank values
- `pokerValue(rank)` — the ace-high value of one rank

## [Unreleased — relicense and de-hardcode]

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

### 0.4.1 — trust the configured host

A `?server=` override naming the host the deployment *already connects to* was
being rejected, because the allowlist only ever covered the page's own origin.
Any setup where the socket lives somewhere other than the web origin — a proxy,
a separate game box — hit this. The configured default server's host is now
implicitly allowed; it is trusted by definition, since the deployment chose it.
It widens the allowlist by exactly that one host and nothing else.

### Changes

- Every package has a README; six npm pages were blank.
- New `scripts/check-no-hardcoded-hosts.mjs`, wired into CI, fails if any
  package names a deployment hostname or LAN address again. Ports are
  deliberately not banned: a default port resolves against the page's own
  hostname and so cannot reach anyone else's machine.
- `check-packaging.mjs` now also asserts `LICENSE` and `NOTICE` ship.
- Documentation fixes: `AdAudio.handleVisibility` takes a boolean, not
  `{ pauseMusic }`; `HandEvaluator` is a class, so `new HandEvaluator().evaluate()`.

## [0.5.0] — 2026-08-18

Released: `cards` 0.5.0.

### Bug fixes

- **adenosine-cards**: `Card.getHTML()` added `this.color` — a *hex* value — as a
  class, so every face-up card rendered as
  `<div class="card face-up #cc0000">`. The stylesheet keys on a word
  (`.card.face-up.red` / `.card.face-up.black`), so both rules had never matched
  anything on any card in any game. Cards still looked right only because the
  corner and pip markup carried `style="color:#cc0000"`, which is why this went
  unnoticed. `Card` now carries a `colorName` of `'red'` or `'black'` and adds
  that instead; a test renders all 52 cards and asserts each matches its
  stylesheet selector and that no class token is a hex value.

### Changes

- **adenosine-cards**: new `SUIT_COLOR_NAMES: Record<Suit, 'red' | 'black'>` and
  the `CardColorName` type, exported alongside `SUIT_COLORS`. `Card.color` still
  holds the hex, so nothing that reads it needs to change — the two are now
  documented as hex-for-fills versus name-for-classes.
- **adenosine-cards**: number and ace cards no longer stamp
  `style="color:…"` on their corners and pips; colour comes from
  `.card.face-up.red` / `.card.face-up.black` and is inherited. This also settles
  a mismatch that predates the class bug: face cards already drew themselves in
  `var(--fc-red)`, while number cards hardcoded `#cc0000`, so on any theme where
  the two differ (solitaire, cribbage and Sökö all set `--fc-red: #cc1111`) a
  king and a seven of the same suit were subtly different reds.
  `cornerHTML()`, `getSuitLayout()` and `pipColor()` keep their exported
  signatures — the colour argument is now optional and simply omitted.
- **adenosine-cards**: `cards.css` gains fallbacks (`var(--fc-red, #cc0000)`,
  `var(--fc-black, #111111)`) so cards still render in colour where a consumer
  has not defined the theme variables — which now matters, since the stylesheet
  is the only thing colouring them.

## [0.4.0 / 0.3.1] — 2026-08-18

Released: `cards` 0.4.0, `chat` 0.3.1, `multiplayer` 0.3.1.

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
