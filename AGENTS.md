# AGENTS.md — adenosine

TypeScript monorepo of seven browser game-engine packages (npm workspaces), published
to npm as `@magmacrunch/adenosine-*`. Zero runtime dependencies. Each package ships
dual-format: ESM for bundlers plus an IIFE bundle (`dist/index.global.js`) consumed
via `<script>`/jsDelivr — the magmacrunch.com website repo loads those IIFE bundles
pinned to exact versions. 592 tests across 36 files. Apache-2.0.

## AI Attribution

**No AI attribution.** Do not append `Co-Authored-By: Claude …`, "Generated with …",
or any similar trailer to commit messages, PR bodies, or release notes. If your
tooling adds such a line by default, remove it before committing.

## Layout

```
package.json            root: private, workspaces = packages/*
packages/
  rpg/                  2D tile RPG engine — loop, camera, collision, sprites (global AdRPG)
  puzzle/               sliding-tile framework (AdPuzzle)
  cards/                deck, pixel-art SVG cards, poker chips (AdCards)
  audio/                Web Audio music + pooled SFX (AdAudio)
  chat/                 floating real-time chat widget (AdChat)
  multiplayer/          game-agnostic multiplayer WebSocket client (AdMP)
  score-client/         WebSocket high-score client, offline queue (AdScore)
  # each package: src/, dist/ (built), API.md, tsup.config.ts, vitest tests
scripts/                check-*.mjs guard scripts run by `npm run check`
tools/                  browser tools: playground.html, tiles.html (tile map editor),
                        theme.html
examples/               one page per package, loads local dist/ builds
.github/workflows/      ci.yml (test, typecheck, build, all guards), publish.yml
```

## Commands

```bash
npm install                        # all workspaces
npm test                           # 592 tests, vitest per package
npm run lint                       # oxlint, zero findings expected
npm run coverage                   # same tests, with per-package thresholds
npm run build                      # per package: tsup (ESM + IIFE) + tsc declarations
npm run typecheck                  # tsc --noEmit per package
npm run check                      # guard scripts below — needs a build first
cd packages/rpg && npm test        # a single package; also test:watch, test:coverage
npm run build && npx serve examples
npx serve tools                    # tools at http://localhost:3000
```

**Node >= 22 to develop, Node >= 20 to consume.** These are different numbers
and the difference is load-bearing. jsdom 30 declares
`^22.22.2 || ^24.15.0 || >=26.0.0`, so `npm test` cannot run on Node 20 —
it dies with `webidl.util.markAsUncloneable is not a function`. oxlint wants
`^20.19.0 || >=22.12.0`. Neither constrains the published packages, which are
browser libraries with zero runtime dependencies.

So `ci.yml` has two jobs: `build` runs the whole toolchain on 22, and `engines`
builds on 22 then switches runtime to import the built packages on 20, 22 and
24 (`scripts/check-consumer-import.mjs`). Running the suite itself across a
Node matrix tests the toolchain, not the promise.

`npm run check` runs seven scripts in `scripts/`, each also a CI step:

| Script | Asserts |
|--------|---------|
| `check-packaging.mjs` | Every file a `package.json` references is in the tarball, and every shipped `.map` resolves its sources |
| `check-publish-resolution.mjs` | `publint` + `attw` agree the manifest resolves for real consumers |
| `check-no-hardcoded-hosts.mjs` | No package ships a deployment's hostnames as fallback |
| `check-api-docs.mjs` | Every method an `API.md` names exists, and every `opts.x` it documents is declared |
| `check-css-fallbacks.mjs` | Every `var()` in shipped CSS carries a fallback |
| `check-cdn-pins.mjs` | jsDelivr version pins in `tools/*.js` match the packages |
| `check-bundle-size.mjs` | Each `dist/index.global.js` is within its gzipped budget |

## Conventions

- Zero runtime dependencies in every package; strict TypeScript.
- Coverage thresholds live in each package's `vitest.config.ts`, pinned to what
  the suite reaches today (rpg 98%, chat 54%, puzzle 51%). They are a ratchet:
  raise them when coverage improves, never lower one to land a change.
- Lint is **oxlint**, not ESLint: typescript-eslint throws "does not support TS 7.0"
  at import against the TypeScript 7 this repo builds with (typescript-eslint #10940).
  oxlint parses TypeScript itself and has no `typescript` dependency. Config is
  `.oxlintrc.json`; `correctness` is an error, and catch params are exempt from
  `no-unused-vars` because `catch(e) {}` is the house idiom.
- No `declarationMap`: tsc only ever runs `--emitDeclarationOnly`, so the maps
  landed solely in the tarball, pointing at a `src/` that `files[]` does not ship.
- Packages version independently (root is private and never published). The
  semver contract is `VERSIONING.md`: a major protects named exports, the IIFE
  globals and `dist/index.global.js`, the `PROTOCOL.md` wire formats, and
  documented CSS custom properties. Underscore-prefixed members and undocumented
  custom properties are explicitly not covered.
- IIFE globals: `AdRPG`, `AdPuzzle`, `AdCards`, `AdAudio`, `AdChat`, `AdMP`,
  `AdScore` — generated by tsup `format: ['esm', 'iife']`.
- Each package's `API.md` is checked against real built exports in CI: update it in
  the same change as any API change, or `check-api-docs.mjs` fails.
- Never inline a deployment hostname as a fallback or allowlist —
  `check-no-hardcoded-hosts.mjs` exists because chat/multiplayer once shipped one.
- The browser tools load packages from jsDelivr off hand-typed version pins
  (~35 places); `check-cdn-pins.mjs` keeps them matched to `package.json`.
- No base classes: engines expose systems, callers wire them (callbacks + data).
- Ship the `NOTICE` file with anything distributed (Apache-2.0 attribution).
- Package-scoped changes go in that package's own `CHANGELOG.md` (shipped in its
  tarball); repo-wide changes — CI, guards, tooling — go in the root
  `CHANGELOG.md`. Do not write the same entry in both.
- Vulnerabilities are reported through GitHub private advisories, per
  `SECURITY.md`. Only the latest version of each package gets fixes.
- `examples/` pages read like tests — they exercise the API and print results;
  `examples/quickstart.html` alone is self-contained off the CDN.

## Sprite sheets (shared contract — do not change unilaterally)

Uniform grid PNG: frames are frameWidth x frameHeight cells, counted left-to-right
then top-to-bottom. The origin/anchor is stored with the sheet at load time, not
re-derived at call sites. This format is read by all three engines — adenosine (TS),
magnolia (C/Wii), texastoast (Python) — so a sheet exported from SPRITE//FORGE
(https://magmacrunch.com/ware/sprite-forge/) feeds all of them. Canonical spec:
`packages/rpg/API.md`, the `sprites.ts` section (`loadSpriteSheet`,
`createSpriteSheet`, `loadSpriteSheets`). Changing the format is a three-repo change.

In code: `loadSpriteSheet(src, { frameWidth, frameHeight, originX, originY })`
resolves to a `SpriteSheet`; `draw` lands the origin pixel on the `(x, y)` passed,
and an out-of-range frame draws a magenta rectangle rather than throwing.

## Publishing / deploy

Publishing a GitHub Release triggers `.github/workflows/publish.yml`:

1. `npm ci && npm run build`, then `npm test` and `npm run check`. A release is
   cut from a tag, not from `main`, and an upload cannot be taken back — so the
   suite and the guards run again here, against the exact tree being shipped.
2. A loop over `packages/*` publishes every package whose version is not already
   on the registry, and fails if that count is zero. `npm publish --workspaces`
   is deliberately not used: it walks alphabetically and stops at the first
   already-published version, so a release bumping only `chat` and `multiplayer`
   would die on `audio` and never reach them.

Auth is the `NPM_TOKEN` secret, and npm is particular about which kind. It must
be a **Classic Automation token, or a granular token with "Bypass 2FA" ticked**.
Anything else fails at the upload itself with `E403 "Two-factor authentication
or granular access token with bypass 2fa enabled is required to publish
packages"` — after a green build, so it arrives late and reads like a permissions
problem rather than a token-type one. Disabling 2FA on the account does not help;
npm wants one of the two, and an account with 2FA off has neither.

There is no release dispatch to the website any more. The website repins its
jsDelivr copies on its own weekly sync, so a freshly published version is not
live in the browser tools the moment a release finishes.

The website consumes the IIFE bundles from
`https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-<pkg>@<version>/dist/index.global.js`.
Because old versions stay on the CDN, a missed repin fails silently — which is
what `check-cdn-pins.mjs` exists to catch.

### Provenance is on; trusted publishing is one step away

`publish.yml` now publishes with `--provenance` under `permissions: id-token:
write`, and upgrades to npm >= 11 before installing. Provenance works with the
existing `NPM_TOKEN` — it needs the OIDC *permission*, not OIDC *auth* — so
installers already get a Sigstore attestation that a tarball was built by this
workflow from this commit.

**Untested until a release actually runs.** Rehearse on a prerelease tag before
relying on it; an upload cannot be taken back.

What remains is retiring the token. OIDC trusted publishing needs a trusted
publisher registered on npmjs.com **for each of the seven packages**, naming
this repo and the workflow filename (`publish.yml`). Once all seven are
registered, delete the `env: NODE_AUTH_TOKEN` block and the secret. Configure
the npm side first: whether npm falls back to the token when no trusted
publisher is registered is undocumented, and a release is the wrong place to
find out.

## Git

Commit and push as magmacrunchmedia. No AI attribution trailers, ever.

<!-- Update this file in the same commit as any change to build, test, deploy, or layout. -->
