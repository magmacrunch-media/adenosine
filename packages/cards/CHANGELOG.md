# Changelog — `@magmacrunch/adenosine-cards`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

## 0.9.0 - 2026-09-04

### Fixed

- **`CribbageHandEval` scored runs off the wrong number.** `countRuns` and the
  run detection in `scorePeggingPlay` both built runs from the counting value,
  which is 10 for J, Q and K alike -- so J-Q-K was three tens and scored
  nothing, and 9-10-J was not consecutive because the jack had become a second
  ten. Runs are ordered by rank now (A=1 through K=13); only fifteens and
  thirty-one still flatten the court to ten.
- **`countRuns` paid every sub-run of a sequence.** 2-3-4-5 scored 3 + 4 + 3 =
  10 where cribbage pays 4. Only the longest run in each consecutive block
  scores, multiplied by the ways duplicate ranks build it -- double run of
  three 6, triple run 9, double double run 12.
- **`scorePeggingPlay` returned early on thirty-one**, so a card that made 31
  *and* completed a run or a pair collected only the 2. Every category is
  counted now: laying the 8 on K-6-7 is 5, not 2.
- `countFlush` no longer needs a starter to see a four-card flush in hand, and
  ignores a hand of fewer than four cards rather than reading a flush off one.

### Added

- `CribbageHandEval.value(rank)` and `.order(rank)` -- the two numbers a card
  carries, exposed because the difference between them is what the run bugs
  above were. `.value()` counts toward fifteen and thirty-one, `.order()` is
  what a run is built from.

### Changed

- Pegging descriptions use the cribbage terms for three and four of a kind:
  `'Pair royal!'` and `'Double pair royal!'`, replacing `'Three of a kind!'` and
  `'Four of a kind!'`. The point values are unchanged.

The logic here is ported from `arcade/cribbage/js/scoring.js` in the website
repo, which was written standalone because this scorer was wrong, and mirrors
`arcade/cribbage/server.py` that the multiplayer game has scored by all along.
Its 50 test cases came with it.

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
