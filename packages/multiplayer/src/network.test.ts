/**
 * Server address resolution.
 *
 * Every multiplayer defect this month was a shape-of-the-module problem rather
 * than a gameplay one: `MP` had no value export, the scheme was hardcoded to
 * `ws:` so an https page could not connect at all, and a `?server=` parameter
 * could aim a visitor's socket at any host. These pin that surface.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { MP } from './network.js';

/** Point the module's `window` at a page with the given URL. */
function onPage(url) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url });
  globalThis.window = dom.window;
  return dom;
}

afterEach(() => {
  delete globalThis.window;
  delete globalThis.MP_DEFAULT_SERVER;
  MP._config = {};
});

describe('_hostOf', () => {
  it('strips scheme, port and path', () => {
    expect(MP._hostOf('wss://magmacrunch.duckdns.org/cribbage')).toBe('magmacrunch.duckdns.org');
    expect(MP._hostOf('ws://192.168.1.16:8765')).toBe('192.168.1.16');
    expect(MP._hostOf('magmacrunch.com:8770/chess')).toBe('magmacrunch.com');
    expect(MP._hostOf('localhost')).toBe('localhost');
  });
});

describe('_isAllowed', () => {
  it('accepts loopback and the origin that served the page', () => {
    onPage('https://games.example.com/arcade/chess/');
    for (const h of ['localhost', '127.0.0.1', 'games.example.com']) {
      expect(MP._isAllowed(h), h).toBe(true);
    }
  });

  it('rejects a host this deployment has not declared', () => {
    // The package used to ship one deployment's hosts in the allowlist, which
    // meant every other install accepted a ?server= pointed at them.
    onPage('https://games.example.com/arcade/chess/');
    expect(MP._isAllowed('someone-elses-server.org')).toBe(false);
  });

  it('trusts the host it is already configured to connect to', () => {
    // A deployment whose game box is not the page's own origin — a proxy, a
    // separate server — must still accept a ?server= naming that same box.
    onPage('https://games.example.com/arcade/chess/');
    MP.configure({ defaultServer: 'relay.example.net/chess' });
    expect(MP._isAllowed('relay.example.net')).toBe(true);
    // ...but only that one. It is not a licence to accept anything.
    expect(MP._isAllowed('evil.example.org')).toBe(false);
  });

  it('trusts the host named by the MP_DEFAULT_SERVER global too', () => {
    onPage('https://games.example.com/arcade/chess/');
    globalThis.MP_DEFAULT_SERVER = 'relay.example.net/chess';
    expect(MP._isAllowed('relay.example.net')).toBe(true);
    expect(MP._isAllowed('evil.example.org')).toBe(false);
  });

  it('accepts extra hosts once configure() names them', () => {
    onPage('https://games.example.com/arcade/chess/');
    MP.configure({ allowlist: ['relay.example.net'] });
    expect(MP._isAllowed('relay.example.net')).toBe(true);
    expect(MP._isAllowed('still-not-this-one.org')).toBe(false);
  });

  it('accepts RFC1918 ranges so LAN and dev play keep working', () => {
    for (const h of ['10.0.0.5', '192.168.1.16', '172.16.0.1', '172.31.255.254']) {
      expect(MP._isAllowed(h), h).toBe(true);
    }
  });

  it('rejects an arbitrary host — a crafted ?server= must not redirect the socket', () => {
    for (const h of ['evil.example.com', 'wss://evil.example.com/chess', '8.8.8.8']) {
      expect(MP._isAllowed(h), h).toBe(false);
    }
  });

  it('does not treat 172.x outside 16-31 as private', () => {
    expect(MP._isAllowed('172.217.14.5')).toBe(false);  // public (Google)
    expect(MP._isAllowed('172.32.0.1')).toBe(false);    // just past the range
  });
});

describe('_scheme', () => {
  it('follows the page protocol for public hosts', () => {
    onPage('https://magmacrunch.com/arcade/chess/');
    expect(MP._scheme('magmacrunch.duckdns.org/chess')).toBe('wss://');
    onPage('http://magmacrunch.com/arcade/chess/');
    expect(MP._scheme('magmacrunch.duckdns.org/chess')).toBe('ws://');
  });

  it('stays on ws: for loopback and LAN, which have no certificate', () => {
    onPage('https://magmacrunch.com/arcade/chess/');
    for (const h of ['localhost:8765', '127.0.0.1:8765', '192.168.1.16:8765', '10.0.0.5:8765']) {
      expect(MP._scheme(h), h).toBe('ws://');
    }
  });

  it('does not force ws: on a public 172.x address', () => {
    // 172.217.14.5 is public. Forcing ws: there means an https page builds a
    // ws: socket, which the browser blocks as mixed content before it connects.
    onPage('https://magmacrunch.com/arcade/chess/');
    expect(MP._scheme('172.217.14.5:8765')).toBe('wss://');
    expect(MP._scheme('172.16.0.1:8765')).toBe('ws://');   // genuinely private
  });

  it('falls back to ws: when there is no window', () => {
    delete globalThis.window;
    expect(MP._scheme('magmacrunch.duckdns.org')).toBe('ws://');
  });
});

describe('_resolveServer', () => {
  it('honours an allowlisted ?server= override', () => {
    onPage('https://magmacrunch.com/arcade/chess/?server=192.168.1.16:8769');
    expect(MP._resolveServer()).toBe('192.168.1.16:8769');
  });

  it('ignores a non-allowlisted ?server= and falls through', () => {
    onPage('https://magmacrunch.com/arcade/chess/?server=evil.example.com:1234');
    globalThis.MP_DEFAULT_SERVER = 'magmacrunch.duckdns.org/chess';
    expect(MP._resolveServer()).toBe('magmacrunch.duckdns.org/chess');
  });

  it('prefers MP_DEFAULT_SERVER when no override is given', () => {
    onPage('https://magmacrunch.com/arcade/cribbage/');
    globalThis.MP_DEFAULT_SERVER = 'magmacrunch.duckdns.org/cribbage';
    expect(MP._resolveServer()).toBe('magmacrunch.duckdns.org/cribbage');
  });

  it('prefers configure({ defaultServer }) over the same-origin fallback', () => {
    onPage('https://games.example.com/arcade/chess/');
    MP.configure({ defaultServer: 'games.example.com/chess' });
    expect(MP._resolveServer()).toBe('games.example.com/chess');
  });

  it('falls back to the origin that served the page, not a baked-in host', () => {
    // The whole point of the de-hardcoding: an install that configures nothing
    // must talk to itself. It used to return magmacrunch.duckdns.org:8765 here,
    // so any third-party page opened a socket to someone else's server.
    onPage('https://games.example.com/arcade/chess/');
    expect(MP._resolveServer()).toBe('games.example.com');

    onPage('http://localhost:8000/arcade/chess/');
    expect(MP._resolveServer()).toBe('localhost:8000');
  });

  it('never resolves to a magmacrunch host without being told to', () => {
    for (const url of ['https://games.example.com/x/', 'http://localhost:8000/x/',
                       'https://example.org/?server=magmacrunch.duckdns.org']) {
      onPage(url);
      expect(MP._resolveServer()).not.toContain('magmacrunch');
    }
  });
});
