#!/usr/bin/env node
/**
 * Assert every hardcoded jsDelivr version pin matches the package it names.
 *
 * The browser tools do not bundle the packages — they load them from jsDelivr at
 * runtime, off a version written into the source by hand. `playground.js` keeps
 * a table of seven exact versions, `tiles.js` has one inline, `theme.js` and
 * every README pin a minor. That is thirty-five places a version is typed out,
 * none of which the compiler, the tests, or `npm publish` can see.
 *
 * So a release bumps `package.json` and nothing else, and the tools keep serving
 * the previous version to everyone who opens them — with no error, because the
 * old version is still on the CDN and still works. The playground demonstrates
 * behaviour the installed package no longer has, which is the failure mode a
 * playground exists to prevent.
 *
 * This checks the pins against the manifests, deliberately **without touching
 * the network**. Asking npm what is published would fail every pull request that
 * bumps a version before releasing it, and would make CI depend on a registry
 * being reachable. Whether a pinned version actually resolves on npm is a
 * different question, asked after publishing by the website's sync workflow.
 *
 * Two pin styles, both legitimate:
 *
 *   exact (`@0.7.4`) — the tools, so a page reload cannot change what it runs
 *   minor (`@0.7`)   — the docs, so a reader picks up patches automatically
 *
 * An exact pin must equal the full version. A minor pin must equal `major.minor`
 * — it is allowed to lag a patch, because that is the point of pinning a minor.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

/**
 * `adenosine-<name>@<version>`, with the scope optional — `theme.js` builds its
 * URLs off a `CDN` constant, so the scope and the package name are never
 * adjacent in the source. Requiring the scope made this check skip that file
 * silently and still report success, which is the failure it exists to prevent.
 */
const PIN = /(?:@magmacrunch\/)?adenosine-([a-z-]+)@(\d+\.\d+(?:\.\d+)?)/g;

/**
 * `playground.js` and `theme.js` build their URLs from a table, so the version
 * never appears next to the package name. Both spell an entry the same way:
 * a key, then a `version` field somewhere in the same object literal.
 */
const TABLE_ENTRY = /^\s*"?([a-z-]+)"?\s*:\s*\{[^}]*\bversion:\s*["'](\d+\.\d+\.\d+)["']/gm;

/** Files that carry pins. Anything not listed here is not checked. */
const FILES = [
  'README.md',
  'tools/playground.js',
  'tools/theme.js',
  'tools/tiles.js',
  'tools/index.html',
  'examples/quickstart.html',
  ...readdirSync(PKG_DIR).map((n) => `packages/${n}/README.md`),
];

const versions = {};
for (const name of readdirSync(PKG_DIR)) {
  try {
    versions[name] = JSON.parse(readFileSync(join(PKG_DIR, name, 'package.json'), 'utf8')).version;
  } catch { /* not a package directory */ }
}

const minor = (v) => v.split('.').slice(0, 2).join('.');

let failed = 0;
let checked = 0;

for (const rel of FILES) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }

  const problems = [];
  const seen = [];

  const note = (pkg, found, style) => {
    const want = versions[pkg];
    if (!want) {
      problems.push(`pins @magmacrunch/adenosine-${pkg}, which is not a package here`);
      return;
    }
    seen.push(pkg);
    const expected = style === 'exact' ? want : minor(want);
    if (found !== expected) {
      problems.push(`${pkg} pinned ${found}, but package.json says ${want} (expected ${expected})`);
    }
  };

  for (const [, pkg, found] of src.matchAll(PIN)) {
    note(pkg, found, found.split('.').length === 3 ? 'exact' : 'minor');
  }
  // A table entry names no package in the URL, so match it separately. Only the
  // tools have these; a README with a `version:` line would not parse as one.
  for (const [, pkg, found] of src.matchAll(TABLE_ENTRY)) {
    if (pkg in versions) note(pkg, found, 'exact');
  }

  // A listed file that reaches the CDN but yields no pin means the spelling
  // moved and the matcher did not follow. Silence there reads as a pass.
  if (!seen.length && !problems.length) {
    if (src.includes('cdn.jsdelivr.net')) {
      problems.push('loads from jsDelivr but no version pin was recognised — the matcher is stale');
    } else {
      continue;
    }
  }
  checked += seen.length;

  if (problems.length) {
    failed++;
    console.error(`FAIL ${relative(ROOT, join(ROOT, rel)).replace(/\\/g, '/')}`);
    for (const p of problems) console.error(`     ${p}`);
  } else {
    console.log(`ok   ${rel} — ${seen.length} pin(s) current`);
  }
}

if (failed) {
  console.error(`\n${failed} file(s) pin a version the packages no longer are.`);
  console.error('A tool loading last release from the CDN looks like it works, which is why');
  console.error('nobody notices. Update the pins, or the site keeps serving the old build.');
  process.exit(1);
}
console.log(`\nAll ${checked} CDN pin(s) match the packages they name.`);
