# Changelog — `@magmacrunch/adenosine-chat`

This package only. Repo-wide changes — CI, guard scripts, build tooling — live
in the [monorepo changelog](../../CHANGELOG.md), which is also where the
narrative for every release before this file existed is written up.

The seven packages version independently, so a number here means nothing about
any other package.

## Unreleased

_Nothing yet._

## 0.4.4 — 2026-08-27

### Security

A peer could run script in every other participant's page; `0.4.3` is affected.

`escapeHtml` escaped by assigning to `textContent` and reading `innerHTML`
back, which never escapes a double quote — a text node has no need of one. The
result went into a double-quoted attribute, so a peer-chosen colour of
`red" onmouseover="alert(1)` closed the attribute and opened an event handler.
Colour is not the page's to choose: the widget broadcasts it to everyone else.

Both render paths now build nodes through the DOM — `createElement`,
`textContent`, `.style.color` — so there is no seam for a quote to sit in.
`escapeHtml` had no callers left and is gone.

## Earlier releases

`0.4.3`, `0.4.2`, `0.4.1`, `0.4.0`, `0.3.1`, `0.3.0`, `0.2.1`, `0.2.0`

Descriptions for these are in the [monorepo changelog](../../CHANGELOG.md).
They are not restated here rather than restated approximately.
