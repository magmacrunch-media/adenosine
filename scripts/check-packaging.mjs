#!/usr/bin/env node
/**
 * Assert each workspace publishes what its manifest promises.
 *
 * Every packaging bug found in this repo so far had the same shape: package.json
 * pointed at a file the tarball did not contain. puzzle exported a styles.css
 * that never existed; cards set "types" to a path excluded by files[]; chat
 * shipped no chat-worker.js at all. None of that is visible from the source
 * tree — only from the tarball npm would actually upload.
 *
 * So: run `npm pack --dry-run --json` per workspace and check every path the
 * manifest references is present. Expectations are derived from package.json
 * rather than hardcoded, so a new export subpath is covered automatically.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

/** Every path a manifest points at, as tarball-relative paths. */
function referencedPaths(pkg) {
  const out = new Set();
  const add = (v) => {
    if (typeof v !== 'string') return;
    if (v.startsWith('./')) out.add(v.slice(2));
    else if (!v.startsWith('.') && /\.[a-z]+$/.test(v)) out.add(v);
  };
  add(pkg.main);
  add(pkg.types);
  add(pkg.module);
  const walkExports = (node) => {
    if (typeof node === 'string') return add(node);
    if (node && typeof node === 'object') Object.values(node).forEach(walkExports);
  };
  walkExports(pkg.exports);
  return [...out];
}

let failed = 0;
const names = readdirSync(PKG_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

for (const name of names) {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, name, 'package.json'), 'utf8'));
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json', '-w', pkg.name], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  const shipped = new Set(JSON.parse(raw)[0].files.map((f) => f.path));

  const problems = [];
  for (const p of referencedPaths(pkg)) {
    if (!shipped.has(p)) problems.push(`manifest points at "${p}" but the tarball has no such file`);
  }
  // Apache-2.0 section 4(a) requires recipients get a copy of the License, and
  // 4(d) requires the NOTICE travel with it — that is the mechanism by which
  // credit for adenosine reaches anyone downstream. npm auto-includes a LICENSE
  // sitting in the package directory but does NOT inherit the monorepo root's,
  // so each package needs its own copy of both.
  for (const legal of ['LICENSE', 'NOTICE']) {
    if (!shipped.has(legal)) problems.push(`tarball has no ${legal} — copy the root one into packages/${name}/`);
  }

  // npm auto-includes README and LICENSE but nothing else, so a doc file that
  // exists in the repo can sit there for months without ever reaching anyone who
  // installs the package. All seven API.md files did exactly that — including the
  // one documenting that poker callers must restamp aces, which is the contract
  // whose absence caused two live scoring bugs.
  if (!shipped.has('API.md')) {
    problems.push(`tarball has no API.md — add it to files[] in packages/${name}/package.json`);
  }

  for (const entry of pkg.files ?? []) {
    const bare = entry.replace(/^\.\//, '').replace(/\/$/, '');
    const covered = [...shipped].some((f) => f === bare || f.startsWith(bare + '/'));
    if (!covered) problems.push(`files[] lists "${entry}" but nothing under it shipped`);
  }

  if (problems.length) {
    failed++;
    console.error(`FAIL ${pkg.name}@${pkg.version}`);
    problems.forEach((p) => console.error(`       ${p}`));
  } else {
    console.log(`ok   ${pkg.name}@${pkg.version} — ${shipped.size} files`);
  }
}

if (failed) {
  console.error(`\n${failed} package(s) would publish a broken manifest.`);
  process.exit(1);
}
console.log(`\nAll ${names.length} packages ship what they promise.`);
