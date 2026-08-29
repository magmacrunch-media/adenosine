# Versioning and support policy

Adenosine follows [semantic versioning](https://semver.org). This document says
what that actually covers, because "semver" on its own does not tell you which
things count as the API.

## The seven packages

All seven cross 1.0.0 **together**, once. After that they version
**independently**: a number in one package says nothing about any other, and
`adenosine-cards@2.0.0` sitting beside `adenosine-audio@1.1.0` is normal rather
than a mistake.

The private root package is never published and its version is meaningless.

## What a major version protects

These four surfaces are public API. A breaking change to any of them requires a
major version. Each is here because something real already depends on it.

**1. Named exports, and their types.** Everything a package's `index.ts`
exports, and the shape of the types it exports alongside them. Renaming an
export, removing one, or narrowing a parameter type is breaking. Widening a
parameter type or adding an optional field is not.

**2. The IIFE globals and the bundle path.** `AdRPG`, `AdPuzzle`, `AdCards`,
`AdAudio`, `AdChat`, `AdMP`, `AdScore`, and `dist/index.global.js`. The
magmacrunch.com arcade loads these off jsDelivr through roughly 35 hand-typed
version pins; the path is frozen in practice already, and this makes it a
promise. It is declared as the `./global` export and the `unpkg`/`jsdelivr`
fields, so `check-packaging.mjs` covers it.

**3. The wire protocols.** The message types and field names documented in
`chat/PROTOCOL.md` and `multiplayer/PROTOCOL.md`. This is the highest-stakes
surface in the project: the servers are third-party, so a silent change breaks
deployments nobody here can see or fix. Adding a message type is minor;
changing or removing one is major.

**4. Documented CSS custom properties.** The `var()` names that shipped CSS
reads *and that a package's own docs name*. Games theme against these, so
renaming one silently restyles somebody's site.

Custom properties **not** named in the docs are internal and may change in a
minor. If you are theming against one that is not documented, open an issue and
it can be promoted — that is a smaller favour to ask than a surprise repaint.

## What a major version does not protect

- Anything reached through a path the `exports` map does not name.
- Anything prefixed with `_`. `MP._socket` is not yours.
- The contents of `dist/*.d.ts` beyond the exported types themselves.
- Console output, log wording, and error *message* text. Error *types* are
  covered; the sentences inside them are not.
- Rendered DOM structure and class names, unless a package's docs name them.
- The dev toolchain: Node floor for contributors, lint rules, test layout.
- Anything documented as experimental in the API reference.

## Deprecation

An export on the way out gets, in order: a `@deprecated` JSDoc tag naming the
replacement, an entry in that package's `CHANGELOG.md`, and **at least one minor
release** where it still works. Only then can a major remove it.

Nothing is removed in a patch. Nothing is removed without appearing in a
changelog first.

## Support

**Only the latest version of each package receives fixes**, security included.
There are no long-term support branches and no backports to older majors.

This is a small project and pretending otherwise would be worse than saying so.
If you need an older line maintained, fork it — Apache-2.0 explicitly allows
that, and it is a more honest answer than a support promise nobody is staffed
to keep.

Security reports go through [SECURITY.md](SECURITY.md), privately.

## Node

Two different numbers, and the difference is deliberate:

- **Consumers need Node >= 20.** That is the `engines` field, and CI verifies it
  by importing every built package on Node 20, 22 and 24.
- **Contributors need Node >= 22.** The dev toolchain has the higher floor —
  jsdom 30 requires `^22.22.2 || ^24.15.0 || >=26.0.0`, so the test suite does
  not run on 20 at all.

The contributor floor is not part of the semver promise and can rise in a minor.
The consumer floor is: raising `engines` is a breaking change.

## Pre-1.0 history

Versions before 1.0.0 did not follow this policy. `cards` went 0.2 → 0.7 with
breaking changes in minors, which is what 0.x means and why the numbers look
uneven across the seven. The monorepo `CHANGELOG.md` records that history.
