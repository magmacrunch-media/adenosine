#!/usr/bin/env node
/**
 * Assert every custom property a shipped stylesheet uses has a fallback.
 *
 * `cards.css` referenced eight custom properties and defined none of them. Two
 * carried fallbacks; six did not, including `--card-face-bg` and
 * `--card-back-bg`. Those six are defined per-game *inside the arcade*, so for
 * anyone else `background: var(--card-face-bg)` resolved to nothing and every
 * card rendered fully transparent — pips and rank painting onto no card at all,
 * from the package whose whole job is drawing cards.
 *
 * It survived because the arcade loaded its own byte-identical copy of the file
 * rather than the published one, so the shipped stylesheet had no consumer and
 * nothing ever exercised it. Same shape as the hardcoded hostnames: a silent
 * dependency on this environment, invisible from inside it.
 *
 * A fallback makes each stylesheet stand alone while keeping the property as the
 * documented way to theme it — the default is the magmacrunch look, overriding
 * is opt-in. `lobby.css` already worked this way for all nine of its properties;
 * this check makes that the rule rather than the exception.
 *
 * Stylesheets are not the only place this happens. `face-cards.ts` emits inline
 * SVG whose fills are custom properties — 602 of them, none with a fallback —
 * so a king painted solid black for the same reason and the CSS-only version of
 * this check saw none of it. Generated markup is checked too, by scanning the
 * built bundle.
 *
 * In scope: any `.css` a package lists in `files[]`, plus `dist/index.global.js`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

/** `var(--x)` with no comma before the closing paren. */
const BARE_VAR = /var\(\s*(--[A-Za-z0-9_-]+)\s*\)/g;

let failed = 0;
let checked = 0;

for (const name of readdirSync(PKG_DIR)) {
  const pkgPath = join(PKG_DIR, name, 'package.json');
  let pkg;
  try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch { continue; }

  const stylesheets = (pkg.files ?? []).filter((f) => f.endsWith('.css'));
  const problems = [];

  for (const rel of stylesheets) {
    const file = join(PKG_DIR, name, rel);
    let css;
    try {
      if (!statSync(file).isFile()) continue;
      css = readFileSync(file, 'utf8');
    } catch {
      problems.push(`files[] lists "${rel}" but it is not there`);
      continue;
    }
    checked++;

    for (const m of css.matchAll(BARE_VAR)) {
      const line = css.slice(0, m.index).split('\n').length;
      problems.push(`${relative(ROOT, file)}:${line} — ${m[1]} has no fallback`);
    }
  }

  // Generated markup: the built bundle may emit var() into inline SVG or HTML.
  const bundle = join(PKG_DIR, name, 'dist', 'index.global.js');
  try {
    if (statSync(bundle).isFile()) {
      const js = readFileSync(bundle, 'utf8');
      checked++;
      const bare = new Set();
      for (const m of js.matchAll(BARE_VAR)) bare.add(m[1]);
      for (const v of bare) {
        problems.push(`dist/index.global.js — ${v} emitted into markup with no fallback`);
      }
    }
  } catch { /* no bundle built */ }

  if (problems.length) {
    failed++;
    console.error(`FAIL ${name}`);
    problems.forEach((p) => console.error(`       ${p}`));
  } else {
    console.log(`ok   ${name} — every var() has a fallback`);
  }
}

if (checked === 0) {
  // A pass over nothing is not a pass. This script has one job and it needs a
  // stylesheet to do it on.
  console.error('FAIL — no shipped stylesheets were found to check.');
  process.exit(1);
}

if (failed) {
  console.error(
    `\n${failed} package(s) ship a stylesheet that depends on a property it does not define.\n` +
    `Give the var() a fallback: var(--card-face-bg, #fffef5). Without one the\n` +
    `declaration is dropped entirely for anyone who has not defined the property.`
  );
  process.exit(1);
}
console.log(`\nAll ${checked} shipped file(s) stand alone.`);
