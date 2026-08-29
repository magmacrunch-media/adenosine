#!/usr/bin/env node
/**
 * Assert each package still resolves for the people who install it.
 *
 * check-packaging.mjs asks whether a referenced file is *in* the tarball.
 * That is not the same question as whether a consumer's resolver can reach
 * it: an `exports` map can list every file correctly and still hand a
 * bundler the wrong condition, or leave `types` unreachable under
 * `moduleResolution: node16` while working fine under `bundler`. Nothing in
 * this repo checked that, so it is checked here with the two tools that
 * specialise in it.
 *
 *   publint  — manifest correctness against the packed tarball
 *   attw     — how `import` and `require` actually resolve, per resolver
 *
 * Two attw settings encode decisions rather than silencing noise:
 *
 *   --profile esm-only   These packages are "type": "module" with only an
 *                        `import` condition, by design: they are browser
 *                        engines shipped as ESM for bundlers and IIFE for
 *                        <script>. attw's default `strict` profile treats a
 *                        CJS `require()` landing on ESM as a fault; under
 *                        esm-only it is the expected result. If adenosine
 *                        ever ships a `require` condition, drop this flag.
 *
 *   --entrypoints .      The CSS files and chat-worker.js are assets, not
 *                        modules. attw only reasons about type resolution,
 *                        so it reports every one of them as unresolvable.
 *                        That those paths exist and ship is already asserted
 *                        by publint and check-packaging.mjs.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

// execSync for the same reason check-packaging.mjs uses it: on Windows these
// resolve to .cmd shims that execFileSync will not spawn.
function run(cmd) {
  try {
    execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return null;
  } catch (err) {
    return `${err.stdout ?? ''}${err.stderr ?? ''}`.trim() || `exited ${err.status}`;
  }
}

let failed = 0;
const names = readdirSync(PKG_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

for (const name of names) {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, name, 'package.json'), 'utf8'));
  const dir = `packages/${name}`;
  const problems = [];

  const publint = run(`npx publint "${dir}"`);
  if (publint) problems.push(`publint:\n${publint}`);

  const attw = run(`npx attw --pack "${dir}" --profile esm-only --entrypoints . --format ascii`);
  if (attw) problems.push(`attw:\n${attw}`);

  if (problems.length) {
    failed++;
    console.error(`FAIL ${pkg.name}@${pkg.version}`);
    problems.forEach((p) => console.error(p.replace(/^/gm, '       ')));
  } else {
    console.log(`ok   ${pkg.name}@${pkg.version} — manifest and type resolution both clean`);
  }
}

if (failed) {
  console.error(`\n${failed} package(s) would not resolve correctly for consumers.`);
  process.exit(1);
}
console.log(`\nAll ${names.length} packages resolve for the resolvers that matter.`);
