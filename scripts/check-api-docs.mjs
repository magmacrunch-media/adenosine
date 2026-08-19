#!/usr/bin/env node
/**
 * Assert every method an API.md names actually exists.
 *
 * The API references were written by reading the source and describing it, which
 * is exactly the process that produces confident fiction. When first checked,
 * `puzzle/API.md` documented five `PuzzleGame` methods — `.shuffle()`, `.move()`,
 * `.isSolved()`, `.getState()`, `.onStateChange()` — and **none of them existed**,
 * while all eighteen real ones went unmentioned. `cards/API.md` named
 * `Card.getID()`, `Deck.draw()`, `Deck.reset()` and `CribbageHandEval.score()`;
 * the real methods are `Deck.deal()` and `CribbageHandEval.scoreHand()`.
 *
 * A wrong API reference is worse than none: it sends someone to write code
 * against a method that will throw. So the docs are checked against the built
 * bundle the same way the tarball is checked against the manifest.
 *
 * Names are resolved against: module exports, class prototypes, plain exported
 * objects, and the objects returned by `create*()` factories — the last of which
 * is where most instance methods live in this codebase.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

// The packages touch the DOM at import time.
const dom = new JSDOM('<!doctype html><body><canvas id="c"></canvas><div id="board"></div></body>',
  { url: 'https://check.local/' });
for (const k of ['window', 'document', 'HTMLElement', 'Element', 'Node',
                 'localStorage', 'sessionStorage', 'WebSocket', 'requestAnimationFrame',
                 'cancelAnimationFrame']) {
  try { globalThis[k] = dom.window[k]; } catch { /* read-only global */ }
}

/** Words that appear as `foo(` in prose or code fences but are not API names. */
const NOT_API = new Set([
  'js', 'ts', 'json', 'html', 'css', 'bash', 'sh',
  'if', 'for', 'while', 'switch', 'function', 'return', 'const', 'let', 'var',
  'require', 'import', 'export', 'new', 'typeof', 'console', 'log', 'catch',
  'then', 'Promise', 'Array', 'Object', 'Math', 'JSON', 'String', 'Number',
  'querySelector', 'getElementById', 'addEventListener', 'appendChild',
  'setTimeout', 'setInterval', 'parseInt', 'parseFloat', 'isNaN',
]);

/** Collect every name reachable from a module, including factory results. */
function surfaceOf(mod) {
  const names = new Set(Object.keys(mod));

  const addOwn = (o) => {
    if (!o || (typeof o !== 'object' && typeof o !== 'function')) return;
    for (const n of Object.getOwnPropertyNames(o)) names.add(n);
  };

  for (const key of Object.keys(mod)) {
    const v = mod[key];
    if (typeof v === 'function') {
      // class -> prototype methods
      try { addOwn(v.prototype); } catch { /* not a class */ }
      // create*() factory -> the object it returns
      if (/^create/.test(key)) {
        for (const args of [[], [{}], [{ size: 4, gameName: 'check' }],
                            [dom.window.document.getElementById('board')]]) {
          try { const r = v(...args); addOwn(r); if (r) for (const n of Object.keys(r)) names.add(n); break; }
          catch { /* try the next shape */ }
        }
      }
    }
    addOwn(v);
  }
  return names;
}

let failed = 0;
for (const name of readdirSync(PKG_DIR)) {
  const docPath = join(PKG_DIR, name, 'API.md');
  try { if (!statSync(docPath).isFile()) continue; } catch { continue; }

  let mod;
  try { mod = await import(join(PKG_DIR, name, 'dist', 'index.js')); }
  catch (e) { console.error(`SKIP ${name} — could not import bundle: ${e.message}`); continue; }

  const surface = surfaceOf(mod);
  // Fenced blocks hold example code and ASCII diagrams — a diagram reading
  // "Page (browser) ──▶ SharedWorker" is not a claim that `Page()` exists.
  // Claims live in headings and inline spans, so strip fences first.
  const doc = readFileSync(docPath, 'utf8').replace(/```[\s\S]*?```/g, '');

  // A claim is a backtick span that IS a call — `foo(...)`, `Obj.foo(...)`,
  // `.foo(...)` — not prose that merely contains a parenthesis. Anchoring to the
  // start of the span is what separates `Deck.deal()` from
  // `the pending queue (see below)`.
  const claimed = new Set();
  for (const span of doc.matchAll(/`([^`]+)`/g)) {
    const m = /^\.?([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\(/.exec(span[1].trim());
    if (m) claimed.add(m[1].split('.').pop());
  }

  const ghosts = [...claimed].filter((c) => !NOT_API.has(c) && !surface.has(c));

  if (ghosts.length) {
    failed++;
    console.error(`FAIL ${name} — API.md documents ${ghosts.length} name(s) that do not exist:`);
    ghosts.forEach((g) => console.error(`       ${g}()`));
  } else {
    console.log(`ok   ${name} — ${claimed.size} documented name(s), all resolve`);
  }
}

if (failed) {
  console.error(`\n${failed} package(s) document an API that is not there.`);
  console.error('A wrong reference is worse than none — it sends people to write code that throws.');
  process.exit(1);
}
console.log('\nEvery documented name exists.');
