#!/usr/bin/env node
/**
 * Assert the shipped bundles have not quietly grown.
 *
 * These are browser libraries, and the IIFE bundle is the one delivered whole:
 * magmacrunch.com loads `dist/index.global.js` off jsDelivr for every arcade
 * page, so its size is a page-weight cost paid by every visitor. The ESM build
 * is tree-shaken by the consumer's bundler, which makes its total a much
 * weaker signal.
 *
 * Budgets are on the **gzipped** size, because that is what crosses the wire
 * and the raw number lies here. `cards` is 100 KB raw and 11.7 KB gzipped --
 * it is mostly pixel-art SVG, which compresses to almost nothing. A budget on
 * raw bytes would make cards look like the problem package when it is not.
 *
 * Set with roughly 15% headroom over today: ordinary work does not trip them,
 * accidentally bundling something large does. Raising a budget is fine when
 * the growth is intended and explained -- silently is the failure mode.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

/** Max gzipped bytes for each package's IIFE bundle. */
const BUDGETS = {
  audio: 2400,
  cards: 13500,
  chat: 6500,
  multiplayer: 5600,
  puzzle: 5500,
  rpg: 9600,
  'score-client': 3100,
};

let failed = 0;
const names = readdirSync(PKG_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

for (const name of names) {
  const budget = BUDGETS[name];
  if (budget === undefined) {
    console.error(`FAIL ${name} — no budget set. Add one to scripts/check-bundle-size.mjs.`);
    failed++;
    continue;
  }

  let bytes;
  try {
    bytes = gzipSync(readFileSync(join(PKG_DIR, name, 'dist', 'index.global.js')), { level: 9 }).length;
  } catch {
    console.error(`FAIL ${name} — no dist/index.global.js. Run \`npm run build\` first.`);
    failed++;
    continue;
  }

  const pct = Math.round((bytes / budget) * 100);
  if (bytes > budget) {
    failed++;
    console.error(`FAIL ${name} — ${bytes} B gzipped, over the ${budget} B budget by ${bytes - budget} B`);
  } else {
    console.log(`ok   ${name} — ${bytes} B gzipped, ${pct}% of its ${budget} B budget`);
  }
}

if (failed) {
  console.error(`\n${failed} bundle(s) outside budget. Raise the budget deliberately, or find what grew.`);
  process.exit(1);
}
console.log(`\nAll ${names.length} bundles within budget.`);
