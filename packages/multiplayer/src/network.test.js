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
  it('accepts the known hosts', () => {
    for (const h of ['magmacrunch.duckdns.org', 'magmacrunch.com', 'localhost', '127.0.0.1']) {
      expect(MP._isAllowed(h), h).toBe(true);
    }
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

  it('points local dev at the Pi rather than the page host', () => {
    onPage('http://localhost:8000/arcade/chess/');
    expect(MP._resolveServer()).toBe('192.168.1.16:8765');
  });

  it('falls back to the public host elsewhere', () => {
    onPage('https://magmacrunch.com/arcade/chess/');
    expect(MP._resolveServer()).toBe('magmacrunch.duckdns.org:8765');
  });
});
