# Changelog — `@magmacrunch/adenosine-multiplayer`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

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
