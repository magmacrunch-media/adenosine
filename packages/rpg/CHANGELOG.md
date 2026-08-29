# Changelog — `@magmacrunch/adenosine-rpg`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

### Added

- **`resetEngine()`** — puts every piece of engine-wide state back to its value
  at import time: player, `map`, `currentMap`, the started/paused/game-over
  flags, transition cooldown, animation counters, camera, held keys and their
  window listeners, the game-over callback, and every listener on the shared
  `engine` bus.
- **`EventBus.clear(event?)`** — removes every listener, or every listener for
  one event. `off` needs the exact function reference, which a caller that
  subscribed with an inline closure never kept, so there was previously no way
  to let those go at all.
- **`resetInput()`** — detaches the window listeners and forgets held keys.
  Existed as the underscored, test-only `_resetInputState`.

### Why

The engine keeps one shared copy of `player`, `map`, `camera`, `keys` and
`engine`, created when the module loads. One game per page is deliberate and
stays that way — but there was no route back to the starting values, so a page
starting a second scene without reloading inherited everything the first did.

The workaround had already been written by hand three times: three playground
examples opened by setting `player.health` back to 100 (five did not), sixteen
of this package's test files reset the same globals in `beforeEach`, and
`input.ts` grew a private `_resetInputState`. The playground now calls
`resetEngine()` before each Run, and those three examples no longer need the
line.

`setOnGameOverCallback` now accepts `null` to clear it.

## Earlier releases

`0.2.3`, `0.2.2`, `0.2.1`, `0.2.0`

Descriptions for these are in the [monorepo changelog](../../CHANGELOG.md).
They are not restated here rather than restated approximately.
