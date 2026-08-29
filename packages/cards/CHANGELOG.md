# Changelog — `@magmacrunch/adenosine-cards`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

## 0.8.0 — 2026-08-29

### Changed

- `renderChips` dropped a vestigial `animClass` parameter no caller passed and the body never read (module-private). `getAceHTML`'s unused `rank` parameter renamed `_rank`; the signature stays parallel to `getNumberCardHTML`.

### Changed — packaging

- `dist/index.global.js` is now a declared export (`./global`) with `unpkg` and
  `jsdelivr` fields, so the bundle the browser tools load off the CDN is named
  in the manifest instead of merely existing at a known path.
- `CHANGELOG.md` now ships in the tarball.
- Dead `.d.ts.map` files are gone. They pointed at a `src/` the tarball has
  never included, so an editor's go-to-definition followed them nowhere.

## Earlier releases

`0.7.4`, `0.7.3`, `0.7.2`, `0.7.1`, `0.7.0`, `0.6.0`, `0.5.0`, `0.4.0`, `0.2.2`, `0.2.1`, `0.2.0`

Descriptions for these are in the [monorepo changelog](../../CHANGELOG.md).
They are not restated here rather than restated approximately.
