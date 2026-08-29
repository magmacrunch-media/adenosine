# Security Policy

## Reporting a vulnerability

**Report privately through GitHub:** open a draft advisory at
[Security → Advisories → Report a vulnerability](https://github.com/magmacrunchmedia/adenosine/security/advisories/new).
That keeps the report visible only to you and the maintainers until a fix ships.

Please do **not** open a public issue for a vulnerability. Public issues are the
right place for everything else, including hardening suggestions that do not
describe an exploitable flaw.

What helps most, roughly in order:

- Which package and version. All seven version independently, so
  `adenosine-chat@0.4.3` is a different claim from "adenosine".
- What an attacker controls, and what they get. The distinction that mattered
  most in this project's one real vulnerability was that the malicious value
  came from *another participant*, not from the page embedding the widget.
- A reproduction — a snippet, a page, or a failing test. A test is ideal,
  because a fix without one is a fix that can come back.

### What to expect

- **Acknowledgement within 3 days**, including whether it is accepted, needs
  more information, or is out of scope.
- If accepted: a fix, a patch release of the affected packages, and a
  `CHANGELOG.md` entry describing the flaw honestly — what it was, what it
  exposed, and why the fix is shaped the way it is.
- Credit in the advisory and changelog unless you ask otherwise.

There is no bounty program. This is a small project.

## Supported versions

Only the **latest published version of each package** receives security fixes.
There are no long-term support branches, and older versions are not patched.
Because the packages version independently, "latest" means latest for that
package — check [npm](https://www.npmjs.com/org/magmacrunch) rather than
assuming a shared number.

| Package | Supported |
|---------|-----------|
| `@magmacrunch/adenosine-audio` | latest only |
| `@magmacrunch/adenosine-cards` | latest only |
| `@magmacrunch/adenosine-chat` | latest only |
| `@magmacrunch/adenosine-multiplayer` | latest only |
| `@magmacrunch/adenosine-puzzle` | latest only |
| `@magmacrunch/adenosine-rpg` | latest only |
| `@magmacrunch/adenosine-score-client` | latest only |

A formal support window is part of the 1.0 versioning policy and does not exist
yet. Until it does, assume nothing older than latest is maintained.

## Scope

These are browser libraries with zero runtime dependencies. The parts worth
attacking, and what the project already does about them:

**Anything a peer can influence.** `chat` and `multiplayer` carry values from
one participant to every other participant's browser — display names, colours,
message text, room and player identifiers. Those are the highest-value inputs
in the project, and the one real vulnerability to date lived exactly there:
`adenosine-chat@0.4.3` escaped by round-tripping through `textContent` and
`innerHTML`, which never escapes a double quote, so a peer-supplied colour of
`red" onmouseover="alert(1)` became an event handler in every other player's
page. Both render paths now build nodes through the DOM rather than
concatenating markup.

**Where connections are allowed to go.** No package may ship a deployment's
hostname as a fallback or a `?server=` allowlist entry; `chat` and `multiplayer`
once did, which pointed third-party installs at a stranger's machine.
`scripts/check-no-hardcoded-hosts.mjs` fails CI on a recurrence.

**What actually gets uploaded.** `scripts/check-packaging.mjs` and
`scripts/check-publish-resolution.mjs` assert the published tarball matches its
manifest and resolves for real consumers, because the source tree looking
correct has never been evidence that the tarball is.

Out of scope: vulnerabilities in a server you point these clients at (the
protocols are documented in `PROTOCOL.md`, the servers are yours), anything
requiring the page embedding the library to be already compromised, and
findings that are purely a lack of hardening with no described attack.
