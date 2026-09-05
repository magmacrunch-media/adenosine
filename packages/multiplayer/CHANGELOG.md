# Changelog — `@magmacrunch/adenosine-multiplayer`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

## 0.5.1 — 2026-09-04

### Fixed

`lobby.css` made the lobby's own exit unreachable on a short, narrow screen.
Both faults needed the same state to show up — host, in a room, so **Start
Game** is displayed and the button row holds four — which is why the lobby
looks correct right up until the moment you want out of it.

- **The button row overran the panel.** `.lobby-buttons` was a `nowrap` flex
  row and `.lobby-btn` was `flex: 1`. A flex item's automatic minimum size is
  its content, so four buttons could not shrink past their own labels and the
  row simply ran off the edge. Measured in Chrome at 360x640, **Leave** began
  9px from the right edge and continued 85px past it, leaving a 9px sliver to
  tap. The row now wraps (`flex: 1 1 45%`, `min-width: 0`), which puts the
  buttons two per row at 360px and, on desktop, fits each label on one line
  instead of breaking it inside the button.

- **A panel taller than the viewport could not be scrolled.** `.lobby-overlay`
  centred `.lobby-panel`, which had no `max-height` and no scrolling, so it
  overflowed in both directions at once and the top was unreachable. At 360x640
  with a room code, two players and a few chat lines the panel measured 646px
  against a 640px viewport, clipped at both ends. The overlay now scrolls
  (`align-items: flex-start`, `overflow-y: auto`) with `margin: auto` on the
  panel, so it stays centred while it fits and scrolls when it does not.

`.lobby-panel` also gained `box-sizing: border-box`. It sets `width: 90%` and
`padding: 30px`, which under the default `content-box` is 388px of panel inside
a 360px viewport — so the stylesheet only ever fit because every page loading it
happened to set `* { box-sizing: border-box }` first. That is the same silent
dependency on this environment that `check-css-fallbacks.mjs` exists to catch,
and it changes nothing for a consumer already applying that reset.

Verified at 360x640, 375x812 and 1280x800, in each of the two-, three- and
four-button states.

## 0.5.0 — 2026-08-29

### Changed

- API reference now documents the connection lifecycle: `MP` does not reconnect, deliberately, because room membership is server-side identity a reopened socket does not restore.

### Changed — packaging

- `dist/index.global.js` is now a declared export (`./global`) with `unpkg` and
  `jsdelivr` fields, so the bundle the browser tools load off the CDN is named
  in the manifest instead of merely existing at a known path.
- `CHANGELOG.md` now ships in the tarball.
- Dead `.d.ts.map` files are gone. They pointed at a `src/` the tarball has
  never included, so an editor's go-to-definition followed them nowhere.

## 0.4.5 — 2026-08-27

### Security

`esc()` was the same `textContent`/`innerHTML` round-trip as chat's, feeding
`id="…"` in the board game template, and `cls` was interpolated into
`class="…"` with no escaping at all. That template builds a string by design,
so `esc()` now escapes the five characters explicitly and `cls` goes through
it. Config here is author-supplied rather than peer-supplied, which made it a
sharp edge rather than a hole — until a game names a button from something it
did not write itself.

## Earlier releases

`0.4.4`, `0.4.3`, `0.4.2`, `0.4.1`, `0.4.0`, `0.3.1`, `0.3.0`, `0.2.2`, `0.2.1`, `0.2.0`

Descriptions for these are in the [monorepo changelog](../../CHANGELOG.md).
They are not restated here rather than restated approximately.
