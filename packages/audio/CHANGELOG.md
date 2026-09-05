# Changelog — `@magmacrunch/adenosine-audio`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

## 0.3.1 — 2026-09-05

### Fixed

- `pauseMusic()` no longer loses the playhead. It stopped the source without
  recording how far it had got, and `playMusic()` always called `start(0)`, so
  every resume replayed the track from its opening. The elapsed time is now
  banked from the context clock on pause and passed as the start offset — and
  wrapped into the buffer, since a looping source given an offset past its end
  clamps rather than wrapping, which would pin a resumed loop to its final
  sample.

  `stopMusic()` and `destroyMusic()` clear that offset. They are ends rather
  than pauses, and the difference was not expressed anywhere before.

- `onVisibilityChange()` no longer starts music that was never playing. Its
  resume branch tested only whether a track had been *loaded*, so a page that
  deliberately had not started one — a title screen, or a game whose music
  belongs to a run in progress — began playing on the first tab-return, with
  no `playMusic()` call anywhere in the app. It now resumes only what it
  paused, which also makes its two branches symmetric: the hide branch already
  guarded on `musicStarted`.

  Reported as [#14](https://github.com/magmacrunch-media/adenosine/issues/14).
  Two of the four games using this module had already routed around it.

## 0.3.0 — 2026-08-29

### Changed

- Dead `VisibilityOptions` import removed. No behaviour change.

### Changed — packaging

- `dist/index.global.js` is now a declared export (`./global`) with `unpkg` and
  `jsdelivr` fields, so the bundle the browser tools load off the CDN is named
  in the manifest instead of merely existing at a known path.
- `CHANGELOG.md` now ships in the tarball.
- Dead `.d.ts.map` files are gone. They pointed at a `src/` the tarball has
  never included, so an editor's go-to-definition followed them nowhere.

## Earlier releases

`0.2.4`, `0.2.3`, `0.2.2`, `0.2.1`, `0.2.0`

Descriptions for these are in the [monorepo changelog](../../CHANGELOG.md).
They are not restated here rather than restated approximately.
