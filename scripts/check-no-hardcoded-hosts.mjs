#!/usr/bin/env node
/**
 * Assert no package hardcodes one deployment's infrastructure.
 *
 * `chat` and `multiplayer` shipped `magmacrunch.duckdns.org`, `magmacrunch.com`
 * and `192.168.1.16` as both their connection fallbacks and their `?server=`
 * allowlists. That is not untidy, it is a defect with a victim: anyone who
 * installed adenosine-chat and called `ChatWidget.connect()` — the example in
 * our own README — opened a socket to a Raspberry Pi they had never heard of
 * and replayed their users' saved chat credentials to it.
 *
 * Both are now configured by the host app, and the arcade supplies its own
 * values through `arcade/shared/{chat,mp,score}-server.js`. This check exists
 * because that arrangement is easy to undo by accident: the fast fix for a
 * connection bug is always to inline the host that works, and nothing else
 * would notice.
 *
 * Scoped package names (`@magmacrunch/adenosine-*`) are the project's identity,
 * not infrastructure, so they pass.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = join(ROOT, 'packages');

/**
 * Literals that tie a package to one deployment.
 *
 * Hosts only — deliberately not ports. A default port is harmless because it is
 * always paired with a default *host*, and that host is the page's own origin:
 * score-client's `DEFAULT_PORT = 8781` resolves against `location.hostname`, so
 * it can only ever reach the installer's own machine. That is a protocol
 * default in the same sense as 5432 for Postgres. A port becomes dangerous only
 * next to a foreign hostname, and the hostname is what this list catches.
 */
const BANNED = [
  { re: /magmacrunch\.duckdns\.org/g, what: 'a specific deployment hostname' },
  { re: /magmacrunch\.com/g, what: 'a specific deployment hostname' },
  { re: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g, what: 'a specific LAN address' },
  { re: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, what: 'a specific LAN address' },
  { re: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g, what: 'a specific LAN address' },
];

/** The scoped package name is identity, not infrastructure. */
const ALLOWED = [/@magmacrunch\/adenosine-[a-z-]+/g];

function scan(file) {
  let text = readFileSync(file, 'utf8');
  for (const ok of ALLOWED) text = text.replace(ok, '');

  const hits = [];
  for (const { re, what } of BANNED) {
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split('\n').length;
      hits.push({ line, literal: m[0], what });
    }
  }
  return hits;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    // Tests legitimately name these hosts to prove they are NOT special.
    else if (/\.(ts|js|mjs)$/.test(e) && !/\.test\./.test(e)) out.push(p);
  }
  return out;
}

let failed = 0;
for (const name of readdirSync(PKG_DIR)) {
  const src = join(PKG_DIR, name, 'src');
  try { if (!statSync(src).isDirectory()) continue; } catch { continue; }

  const problems = [];
  for (const file of walk(src)) {
    for (const h of scan(file)) {
      problems.push(`${relative(ROOT, file)}:${h.line} — "${h.literal}" is ${h.what}`);
    }
  }

  if (problems.length) {
    failed++;
    console.error(`FAIL ${name}`);
    problems.forEach((p) => console.error(`       ${p}`));
  } else {
    console.log(`ok   ${name}`);
  }
}

if (failed) {
  console.error(
    `\n${failed} package(s) hardcode deployment infrastructure.\n` +
    `Take it as a configuration option instead — see MP.configure() in\n` +
    `packages/multiplayer/src/network.ts, and let the host app supply the value.`
  );
  process.exit(1);
}
console.log(`\nNo package hardcodes deployment infrastructure.`);
