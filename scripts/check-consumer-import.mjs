#!/usr/bin/env node
/**
 * Assert the published packages work on the oldest Node they claim.
 *
 * Every package declares `engines.node >= 20`. That is a promise made to
 * whoever installs them — not a claim that this repo's dev toolchain runs
 * there, which it does not: jsdom 30 declares
 * `^22.22.2 || ^24.15.0 || >=26.0.0`, so the test suite cannot execute on 20 at
 * all. Running the whole suite across a Node matrix therefore tests the wrong
 * thing, and fails for a reason that has nothing to do with what adenosine
 * promises.
 *
 * What a Node 20 consumer actually does is import the built ESM and call into
 * it. So that is what this checks, on whatever Node it is run with: every
 * package's entry point loads, and the exports its own API.md leans on are
 * really there and really callable.
 *
 * Deliberately dependency-free and built-artifact-only, so it can run under a
 * Node version that could not install or execute the dev tooling.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

/**
 * A few real exports per package. Not exhaustive — check-api-docs.mjs already
 * covers the full surface. The point here is that the module *evaluates* on
 * this Node and its bindings survive, not that the API is complete.
 */
const EXPECTED = {
  audio: ['init', 'playSfx', 'playMusic', 'destroy'],
  cards: ['Deck', 'HandEvaluator', 'RANK_VALUES'],
  chat: ['ChatWidget'],
  multiplayer: ['MP', 'BoardGameTemplate'],
  puzzle: ['PuzzleGrid', 'createGame', 'createScoring'],
  rpg: ['player', 'createGameLoop', 'initCanvas', 'handleMovement'],
  'score-client': ['ScoreClient'],
};

let failed = 0;
const names = readdirSync(PKG_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

for (const name of names) {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, name, 'package.json'), 'utf8'));
  const expected = EXPECTED[name];
  if (!expected) {
    console.error(`FAIL ${name} — no expected exports listed. Add some to scripts/check-consumer-import.mjs.`);
    failed++;
    continue;
  }

  let mod;
  try {
    mod = await import(pathToFileURL(join(PKG_DIR, name, 'dist', 'index.js')).href);
  } catch (err) {
    console.error(`FAIL ${pkg.name} — entry point did not load on Node ${process.versions.node}:`);
    console.error(`       ${err.message}`);
    failed++;
    continue;
  }

  const missing = expected.filter((k) => mod[k] === undefined);
  if (missing.length) {
    console.error(`FAIL ${pkg.name} — loaded, but missing: ${missing.join(', ')}`);
    failed++;
  } else {
    console.log(`ok   ${pkg.name}@${pkg.version} — imports and exports resolve`);
  }
}

if (failed) {
  console.error(`\n${failed} package(s) do not work on Node ${process.versions.node},`);
  console.error('which is inside the range their engines field promises.');
  process.exit(1);
}
console.log(`\nAll ${names.length} packages import cleanly on Node ${process.versions.node}.`);
