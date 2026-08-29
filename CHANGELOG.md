# Changelog

All notable changes to the adenosine monorepo are documented here.

This file records **repo-wide** changes — CI, guard scripts, build tooling,
licensing. Changes to a single package now go in that package's own
`CHANGELOG.md`, which ships in its tarball.

## [Unreleased]

### Changed — vitest 4

Dependabot proposed `vitest` and `@vitest/coverage-v8` as two separate PRs
(#6, #7). They cannot land apart: either alone leaves the runner and its
coverage provider on different majors. Merged as one change instead.

All 600 tests pass unmodified. Coverage thresholds were **re-baselined, not
lowered** — v4 counts differently, and the denominators prove it rather than
the percentages:

| | statements | branches | functions |
|---|---|---|---|
| audio | 209 → 132 | 52 → 77 | 26 → 28 |
| cards | 943 → 544 | 246 → 249 | 63 → 100 |
| chat | 613 → 480 | 95 → **279** | 42 → 66 |
| puzzle | 628 → 413 | 141 → 174 | 66 → **105** |
| rpg | 992 → 664 | 392 → 416 | 114 → 136 |

Statement counts fell while branch and function counts rose sharply, so the two
instruments do not produce comparable percentages. No test was removed or
weakened, and rpg still covers 100% of its functions under both.

## [audio 0.3.0, cards 0.8.0, chat 0.5.0, multiplayer 0.5.0, puzzle 0.3.0, rpg 0.3.0, score-client 0.3.0] — 2026-08-29

A minor across all seven: each gains `./global` as a declared export, and `rpg`
gains `resetEngine()`. Deliberately **not** 1.0.0 — `resetEngine` was written
today and has never run outside this repo, and freezing a day-old API into a
permanent promise is what 1.0 exists to avoid. 1.0.0 follows once this has run
in the arcade, as a version-only change with no behaviour in it.

### Added — a release-engineering floor

- **oxlint** over packages, scripts, tools and examples, with a CI step. Not
  ESLint: typescript-eslint throws `does not support TS 7.0` at import against
  the TypeScript 7 this repo builds with (typescript-eslint #10940).
- **Coverage thresholds** per package, pinned to what each suite reaches today
  (rpg 98%, chat 54%, puzzle 51%) — a ratchet that fails on a drop.
- **`scripts/check-publish-resolution.mjs`**, running `publint` and `attw` over
  every workspace. Being in the tarball and being reachable are different
  questions and only the first was being asked.
- **A Node 20 CI leg.** Every package declares `engines.node >= 20`; CI ran only
  22, so the floor was untested.
- **`SECURITY.md`**, and a `CHANGELOG.md` per package.

### Fixed

- **Declaration maps pointed at nothing.** `declarationMap` was on, so all seven
  packages shipped `dist/*.d.ts.map` naming `../src/*.ts` — a path `files[]` has
  never included. 55 dead maps. `check-packaging.mjs` now fails on any shipped
  map whose sources are neither present nor inlined.
- **`tools/examples/rpg-transitions.js` had a house you could not leave.** The
  map builder tested walls before the door, and the door sits on the bottom
  wall, so the door tile was never emitted — in the example whose subject is
  two-way transitions. Found by the lint pass.
- Twelve dead imports, a vestigial `animClass` parameter in `cards`, and an
  uncalled `el()` helper plus a write-only `activeTab` in `chat`.

## [chat 0.4.4, multiplayer 0.4.5] — 2026-08-27

### Security — `chat` 0.4.4, `multiplayer` 0.4.5

**A peer could run script in every other player's page.** `adenosine-chat`
0.4.3 is affected; upgrade to 0.4.4.

`escapeHtml` escaped by assigning to `textContent` and reading `innerHTML` back.
That runs the HTML fragment serialization algorithm, which escapes `&`, `<`, `>`
and a non-breaking space — and **not** the double quote, because a text node
never needs one escaped. The result went straight into a double-quoted
attribute:

```js
'<span class="chat-name" style="color:' + escapeHtml(color) + '">'
```

A `color` of `red" onmouseover="alert(1)` closed the attribute and opened an
event handler. `color` is not the page's to choose: the widget sends
`{type:'set_color', color}` and the server broadcasts it back to everyone else,
so one participant picked what every other participant's browser parsed.

The fix is not a bigger escape table. Both render paths now build their nodes
through the DOM — `createElement`, `textContent`, and `.style.color` — so the
markup has no seam for a quote to sit in, and a colour goes through the CSSOM,
which either accepts a value or drops it. `escapeHtml` had no callers left and
is gone; a corrected copy sitting unused is an invitation to reuse it.

`multiplayer`'s `esc()` was the same round-trip, feeding `id="…"` in the board
game template, and `cls` was interpolated into `class="…"` with no escaping at
all, immediately beside an `esc()` call. That template builds a string by design,
so `esc()` now escapes the five characters explicitly and `cls` goes through it.
Config there is author-supplied rather than peer-supplied, which makes it a sharp
edge rather than a hole — until a game names a button from something it did not
write itself.

Both are covered by tests now, asserting on **parsed attributes** rather than on
the HTML string: what makes this a vulnerability is not that the string looks
wrong, it is that the browser agrees to build an attribute out of it. All seven
fail against the old code.

This landed in the one part of the codebase with no coverage at all. Chat's 22
tests were entirely about SharedWorker URLs and `?server=` allowlisting — the
lesson from the *previous* security bug. Nothing rendered anything.

### Fixed — documentation

- `BoardGameTemplate.render()` was documented as returning nothing and modifying
  the DOM. It does both: it appends to `.container` **and** returns the markup.
- `AGENTS.md` still listed `tools/sprites.html` and named it the canonical
  SPRITE//FORGE path, three commits after `b9eba16` moved the editor out.
- Test counts said 559 across 35 files; the real numbers had been 583 across 36
  for some time, and are 592 after the tests above.
- `README.md` said `npm run check` runs four scripts and omitted
  `check-cdn-pins.mjs` from its table. `AGENTS.md` already had this right.

### Changed — metadata

Every package's metadata changed; no package's code did.

### Added — `rpg` can load sprite sheets

`packages/rpg` had no way to get an image onto the screen. `renderWorld` takes a
`renderTile` callback and `createSpriteRegistry` takes draw functions; both hand
the drawing back to the caller, and `createAnimationCounter` returns a frame
index it never indexes anything with. Every adenosine game therefore drew itself
out of `fillRect` calls, and it was the one engine here that could not consume a
sprite sheet — magnolia and texastoast both read one.

`loadSpriteSheet(src, opts)` resolves to a `SpriteSheet` over a uniform grid:
`frameWidth × frameHeight` cells counted left-to-right then top-to-bottom, so a
single-row sheet has frame *i* at column *i*. That is the same grid texastoast
slices and the same file magnolia embeds, so one exported sheet now feeds all
three. `createSpriteSheet(image, opts)` wraps an image the game already has, and
`loadSpriteSheets(entries)` loads a named batch.

The origin is stored on the sheet rather than re-derived at each call site, so
`draw` lands it on the coordinate passed in. A sprite anchored at its feet keeps
its footing when it scales, and `flipX` mirrors about the origin so turning
around does not shift a character sideways. `frameCount` feeds
`createAnimationCounter` directly, which is what that counter was always for.

An out-of-range frame draws a magenta rectangle rather than throwing or drawing
nothing — the tell `createSpriteRegistry` already uses for an unregistered type.
A render loop should surface the bug without stopping, and a silent no-op is
indistinguishable from a sheet that failed to load.

### Changed — the sprite editor moved to magmacrunch.com

`tools/sprites.html` was added here and has been removed again without ever
shipping. It never belonged: `tiles.html` loads the adenosine-rpg bundle and
drives fifteen AdRPG calls to preview a map in the real engine, while the sprite
editor imported nothing and shared no code with any engine. Its output is
deliberately engine-neutral, and the two engines it targeted first were the C
one and the Python one.

It now lives at <https://magmacrunch.com/ware/sprite-forge/> as SPRITE//FORGE,
beside the other standalone browser art tools, and the tools hub links out to
it. One copy exists, so it does not drift from a second one kept in step by
hand. The sheets it writes are what `loadSpriteSheet` reads.

### Changed — `homepage` now points at the tools, not the README

All seven manifests pointed `homepage` at
`https://github.com/magmacrunchmedia/adenosine#readme`, so npm's "Homepage" link
landed a reader back on the same README npm was already rendering. It now points
at <https://magmacrunch.com/ware/adenosine/>, where the packages can be tried in
a browser without installing anything. `repository` is unchanged — that is what
drives npm's "Repository" link, and each package's `directory` field correctly
locates it in the monorepo. The root manifest gained the same `homepage` and its
`repository` was normalised to the object form the seven packages already use.

### Added — a check that the CDN pins are not last release's

The browser tools do not bundle the engines. They load them from jsDelivr at
runtime off a version typed into the source by hand: seven in `playground.js`,
four in `theme.js`, one inline in `tiles.js`, and a minor pin in every README —
**thirty-five in total**, none of which the compiler, the tests, or `npm publish`
can see.

So a release bumps `package.json` and nothing else, and every tool keeps serving
the previous build to everyone who opens it. There is no error, because the old
version is still on the CDN and still works. A playground demonstrating
behaviour the installed package no longer has is worse than none.

`scripts/check-cdn-pins.mjs` checks each pin against the manifest of the package
it names — exact pins to the full version, minor pins to `major.minor`. It is
deliberately **offline**: asking npm what is published would fail every pull
request that bumps a version before releasing it, and would make CI depend on a
registry being reachable. Whether a pinned version actually resolves on npm is a
different question, asked after publishing.

It also fails when a file reaches jsDelivr but yields no recognisable pin. The
first draft required the `@magmacrunch/` scope, which `theme.js` never writes
next to the package name — so it skipped that file entirely and still reported
success, the same shape of green-but-vacuous run that `check-api-docs.mjs` had
on Windows.

### Added — the website repins itself weekly

magmacrunch.com rewrites the pins in its copy of the tools and commits, on a
weekly schedule, confirming every version resolves on npm before writing.

`magmascript` and `texastoast` also have their release workflow dispatch that
sync immediately, which costs a cross-repo PAT on every repo that sends one.
Adenosine does not: `publish.yml` stays the five steps it has always been and
needs no secret but `NPM_TOKEN`. The tradeoff is that the site's pins can lag a
release by up to a week — visible to nobody, because the previous version is
still on the CDN and still works, which is the whole reason the sync exists. Run
the workflow by hand from the Actions tab to skip the wait.

### Fixed — tools loading the wrong copy

- `tools/tiles.js` loaded the RPG engine from the CDN unconditionally, so the
  map editor's preview showed the last release even when served from `tools/`
  beside a freshly built `packages/rpg/dist/`. It now prefers the local build,
  matching what `playground.js` and `theme.js` already did.
- The playground's footer kept reading `ready` from the previous package while a
  new bundle was in flight. It says `loading…` now.

### Added — a place to try the packages without installing anything

- **Playground** (`tools/playground.html`) — a live editor that loads each
  package's IIFE bundle from jsDelivr or from `packages/*/dist/`, runs the code,
  and captures console output. It exists because the fastest previous route to
  seeing a deck deal was `npm install` plus a bundler.
- **16 example files** in `tools/examples/`, covering all seven packages — eight
  of them RPG, which needs the most wiring to show anything.
- **Tile map editor** (`tools/tiles.html`) — pixel art editor for RPG maps with
  paint/fill/pick tools, JSON export/import, and a live RPG preview. Its output
  drops straight into `AdRPG.setMap()`.
- **CSS theme customizer** (`tools/theme.html`) — live color picker for cards
  (13 vars), puzzle (11 vars), chat (12 vars), and multiplayer (7 vars), with a
  `:root {}` block to copy out. It is the companion to the custom properties the
  2026-08-19 release added.
- **`AGENTS.md`** — repository conventions for coding agents.

### Changed

- `playground/` became `tools/`, with a hub page indexing all three tools. One
  tool in a directory named for one tool does not survive the second tool.
- Tools pages share a header, an about section, and consistent back links. An
  earlier about *modal* was tried and dropped — three pages that each opened
  their own dialog to say the same paragraph.
- Tools resolve packages from jsDelivr when served from `magmacrunch.com` and
  from `packages/*/dist/` otherwise, so the deployed copies work without a build
  and the local ones pick up local changes.

### Fixed

- Test count in the README badge (546 → 559) and a `magmacrunch` typo.
- `rpg-camera` example used its own key handling instead of the engine's input.
- Duplicate `MP.quit()` entry in `packages/multiplayer/API.md`.

### Fixed — documentation that described APIs which do not exist

The API references were written by reading the source and describing it, which is
the process that produces confident fiction. `scripts/check-api-docs.mjs` catches
names that do not exist; it does not read parameter lists, and these all named
real functions with invented signatures.

- **`packages/puzzle/API.md` had four of five factories wrong.** `createUI` takes
  no arguments and builds modals and dropdowns — it was documented as
  `createUI(game, container)`, a binding layer it never was. `createRenderer` is
  `create(boardElement, config?)` and renders `<div>` tiles into the DOM; it was
  documented as a canvas renderer taking an `HTMLCanvasElement`. `createScoring`
  is `create(gameName, config?)` and persists to `localStorage`; it was
  documented as taking a game and an `adenosine-score-client` instance, which it
  has never touched. `createInput` is `create(callbacks, boardElement?)`, not
  `(game, container, callbacks?)`. `StateChangeInfo` was given three fields it
  does not have instead of the six it does.
- **`packages/cards/API.md`** documented `new CribbageHandEval()` — it is a plain
  object and cannot be constructed — and `renderStack(ctx, denom, count, cx,
  topY)` returning a Y coordinate, when it takes a canvas *element*, three
  arguments, and returns nothing.
- **`packages/multiplayer/API.md`** documented `createRoom()` and
  `joinRoom(code)`. Both take `(name, color, roomCode)`; a call written from the
  old docs sends a room request with no player attached.

### Added — the rest of the public surface, now documented

- `packages/cards/API.md`: the card-art exports (`pipColor`, `cornerPipSVG`,
  `cornerHTML`, `getSuitLayout`, `getNumberCardHTML`, `getAceHTML`,
  `FACE_CARD_SVG`, `FC_PIP_ART`, `FC_CORNERS`, `getCardBackSVG`), `ChipAnim`, and
  the `HAND_RANKS` / `HAND_POINTS` / `CRIBBAGE_SCORE` tables. Three of these were
  named in a stability guarantee in the 2026-08-19 entry while appearing in no
  reference at all.
- `packages/multiplayer/API.md`: `MP.join`, `MP.spectate`, and the `MsgType`,
  `BoardGameConfig`, and `BoardGameButton` types.
- `packages/rpg/API.md`: `DIRECTION_VECTORS`.

### Fixed — checks that could not run on Windows

- `scripts/check-packaging.mjs` spawned a bare `npm`, which on Windows is
  `npm.cmd` — `execFileSync` will not find it by `PATHEXT` and, since Node 20,
  will not spawn it directly either. The check crashed rather than ran.
- **`scripts/check-api-docs.mjs` imported bundles by absolute path**, which the
  ESM loader reads as a URL with protocol `c:` on Windows. Every package was
  skipped, and the script still printed "Every documented name exists" and exited
  0 — a green check that had checked nothing. Skips are now a failure.

## [adoptable: CDN, theming] — 2026-08-19

Patch bumps across all seven. No behaviour change.

### A path from npm to something on screen

Every README's script tag was `<script src="adenosine-cards.js">` — a relative
path to a file the reader does not have. Each now carries a working jsDelivr URL
pinned to a minor, and `examples/quickstart.html` is a single self-contained file
that deals a hand with no npm, build step or server.

**`adenosine-chat` cannot use its SharedWorker from a CDN**, and now says so.
A SharedWorker may only be constructed from a same-origin URL; a cross-origin one
is refused whatever CORS headers the host sends. The widget resolves its worker
as a sibling of the script that loaded it, so a CDN load always lands
cross-origin, and the failure is caught — leaving a per-tab socket instead of the
shared connection the package exists for, with nothing to indicate it. Serve
`chat-worker.js` yourself and pass `connect({ workerUrl })`.

### Theming

`chat` and `puzzle` had no custom properties at all — 56 and 81 hardcoded colour
literals. Both now expose a named set with fallbacks equal to today's values, so
nothing changes visually and one override retints the widget.

Colours derived from an accent — glows, hover tints — go through `color-mix`
against the same property, in all four CSS-shipping packages. Previously
`lobby.css` left its glows hardcoded, so rethemeing `--accent` produced a cyan
halo around a recoloured panel. Verified equivalent: `color-mix(in srgb, X N%,
transparent)` renders pixel-identical to `rgba(X, N/100)` across all twelve
conversions.

`color-mix()` needs Chrome 111 / Safari 16.2 / Firefox 113, all 2023.

Puzzle's per-tile value gradient stays literal — seventeen one-use colours are
not theme roles. Restyle them with `.tile[data-value="…"]` instead.

### Also

- A **Theming** section per CSS-shipping README, including the eight properties
  the card art reads that the stylesheet never mentions.
- `sideEffects: false` on `rpg`, `audio` and `score-client`.
- Every README states the packages are ESM-only.

## [cards 0.7.3] — 2026-08-19

### Bug fixes

- **adenosine-cards**: the shipped stylesheet and the face-card art referenced
  CSS custom properties they never defined, so for anyone outside the arcade
  **cards rendered fully transparent and kings, queens and jacks painted solid
  black**. The pips and rank drew onto no card at all.

  `cards.css` used eight properties with fallbacks on two. `face-cards.ts` emits
  its pixel art as inline SVG whose fills are properties — 602 of them, none with
  a fallback. The values are defined per-game inside the arcade
  (`arcade/solitaire/css/base.css` and friends), so the omission was invisible
  from in here.

  It also had no consumer to catch it: the arcade links its own byte-identical
  copy of `cards.css`, and `sync-adenosine.mjs` syncs only `.js`, so the
  published stylesheet had never been loaded by anything.

  Every property now carries a fallback matching the arcade's value. The default
  look is unchanged; the difference is that it now survives being installed.

- `scripts/check-css-fallbacks.mjs` fails on a custom property without a
  fallback, in shipped stylesheets **and** in the built bundle — the CSS-only
  form of this check missed all 602 of the SVG fills. Wired into CI.

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

## [relicense and de-hardcode] — 2026-08-18

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
