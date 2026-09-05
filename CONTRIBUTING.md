# Contributing to adenosine

Seven browser game-engine packages in one npm workspace. Issues and pull
requests are welcome. Vulnerabilities are not — those go through
[SECURITY.md](SECURITY.md), privately.

## Getting set up

```bash
npm install
npm test           # 639 tests, vitest per package
npm run lint       # oxlint
npm run build      # tsup (ESM + IIFE) + tsc declarations
npm run check      # the six guard scripts -- needs a build first
```

**Node 22 or newer to develop.** The packages themselves support Node 20 — and
CI checks that by importing the built output there — but the test suite cannot
run on 20, because jsdom 30 requires `^22.22.2 || ^24.15.0 || >=26.0.0`.

## What CI will ask of you

Six scripts in `scripts/` run on every PR. Each exists because the thing it
checks went wrong at least once:

| Script | Asserts |
|--------|---------|
| `check-packaging.mjs` | Every file a manifest references is in the tarball, and every shipped sourcemap resolves |
| `check-publish-resolution.mjs` | `publint` + `attw` agree the package resolves for bundlers and node16 |
| `check-no-hardcoded-hosts.mjs` | No package ships a deployment's hostnames as a fallback or allowlist |
| `check-api-docs.mjs` | Every method an `API.md` names exists on the built bundle, and every option it documents is declared |
| `check-css-fallbacks.mjs` | Every `var()` in shipped CSS carries a fallback |
| `check-cdn-pins.mjs` | Hand-typed jsDelivr pins match the packages they name |

Plus lint, typecheck, and coverage thresholds.

## Conventions worth knowing before you write code

- **Zero runtime dependencies**, in every package. A PR that adds one needs to
  argue for it first. Dev dependencies are fine.
- **No base classes.** Engines expose systems and callers wire them together
  with callbacks and data. If you find yourself writing `extends`, that is a
  sign the seam belongs somewhere else.
- **`API.md` is checked against the built bundle.** Update it in the same change
  as any API change or CI fails. This is not a style preference: the references
  were once written by describing the source from memory, and `puzzle/API.md`
  ended up documenting five `PuzzleGame` methods that did not exist.
- **Never inline a deployment hostname**, as a fallback or as a `?server=`
  allowlist entry. `chat` and `multiplayer` once shipped one deployment's
  hostnames as both, which pointed every third-party install's traffic at a
  stranger's machine.
- **Shipped files stand alone.** A CSS custom property needs a fallback, because
  the arcade happens to define those values per-game and nobody else does.
- **Coverage thresholds are a ratchet.** Raise them when coverage improves.
  Lowering one to land a change is the thing they exist to prevent.
- **Changelogs:** package-scoped changes go in that package's `CHANGELOG.md`;
  repo-wide changes (CI, guards, tooling) go in the root one. Not both.
- **No AI attribution trailers** in commits, PR bodies, or release notes. If
  your tooling adds one by default, remove it before committing.

## The sprite sheet format is a three-repo contract

Uniform grid PNG, frames counted left-to-right then top-to-bottom, origin stored
with the sheet at load time. The same format is read by adenosine (TypeScript),
magnolia (C/Wii) and texastoast (Python), so a sheet exported from SPRITE//FORGE
feeds all three. Canonical spec is the `sprites.ts` section of
`packages/rpg/API.md`. Changing it is a three-repo change, not a PR here.

## Tests

vitest, colocated as `src/*.test.ts`. Some files select an environment with a
`@vitest-environment jsdom` docblock; there is no global environment setting.

Prefer tests that assert on observable behaviour over tests that assert on the
shape of a string. The XSS in chat 0.4.3 is the reason: what made it a
vulnerability was not that the markup looked wrong, it was that the browser
agreed to build an attribute out of it. The tests covering it assert on parsed
attributes for exactly that reason.

## Versioning

The seven packages version independently, and the private root package is never
published. A number in one package's changelog means nothing about any other.

[VERSIONING.md](VERSIONING.md) is the policy: what a major protects (named
exports, IIFE globals and the bundle path, the wire protocols, documented CSS
custom properties), what it does not, and how deprecations work. Read it before
changing anything in those four categories.
