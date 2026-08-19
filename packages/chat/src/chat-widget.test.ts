/**
 * Worker URL resolution.
 *
 * The SharedWorker is the point of this package — it holds one socket across
 * page navigations. Resolution used to scan for a <script> tag named literally
 * 'chat-widget.js', which broke twice over: tsup renames the bundle, and the
 * arcade appends ?v= cache-busters. Both misses fell back to a page-relative
 * guess for a file that was not published, so the worker never loaded and the
 * widget quietly degraded to a per-page socket.
 *
 * The module reads document.currentScript while it is evaluating, so each case
 * builds its DOM first and then imports the module fresh.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

let requestedWorkerUrl: string | null = null;
/** The chat server URL the widget hands to the worker on connect. */
let requestedServerUrl: string | null = null;

/**
 * Stand up a page with a given loading <script>, import the widget into it, and
 * report the URL it hands to SharedWorker.
 */
async function resolveWith(opts: {
  scriptSrc?: string | null;
  pageUrl?: string;
  currentScript?: boolean;
  connectOpts?: { workerUrl?: string; server?: string; allowlist?: readonly string[] };
}): Promise<string | null> {
  const { scriptSrc = null, pageUrl = 'https://magmacrunch.com/arcade/tetris/',
          currentScript = true, connectOpts } = opts;

  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: pageUrl });
  const { window } = dom;

  let el: HTMLScriptElement | null = null;
  if (scriptSrc) {
    el = window.document.createElement('script');
    el.src = scriptSrc;
    window.document.body.appendChild(el);
  }
  if (currentScript && el) {
    Object.defineProperty(window.document, 'currentScript', { value: el, configurable: true });
  }

  requestedWorkerUrl = null;
  requestedServerUrl = null;
  (window as unknown as Record<string, unknown>)['SharedWorker'] =
    function (this: unknown, url: string) {
      requestedWorkerUrl = url;
      (this as { port: unknown }).port = {
        onmessage: null, start() {},
        postMessage(raw: string) {
          try {
            const m = JSON.parse(raw);
            if (m._worker === 'connect') requestedServerUrl = m.url;
          } catch { /* not our message */ }
        },
      };
    };

  // the module reads document/window at evaluation time
  globalThis.window = window as unknown as Window & typeof globalThis;
  globalThis.document = window.document;
  globalThis.SharedWorker = (window as unknown as Record<string, unknown>)['SharedWorker'] as never;
  globalThis.WebSocket = window.WebSocket as never;
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;

  vi.resetModules();
  const { ChatWidget } = await import('./chat-widget.js');
  ChatWidget.connect(connectOpts);
  return requestedWorkerUrl;
}

/** Same setup, but report the chat server the widget decided to talk to. */
async function serverFor(opts: Parameters<typeof resolveWith>[0]): Promise<string | null> {
  await resolveWith(opts);
  return requestedServerUrl;
}

afterEach(() => {
  for (const k of ['window', 'document', 'SharedWorker', 'WebSocket', 'localStorage', 'sessionStorage']) {
    delete (globalThis as unknown as Record<string, unknown>)[k];
  }
});

describe('SharedWorker URL resolution', () => {
  it('derives the worker from the tag that loaded the bundle, whatever it is named', async () => {
    expect(await resolveWith({ scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js' }))
      .toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('survives a ?v= cache-buster on the script src', async () => {
    expect(await resolveWith({ scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js?v=a1b2c3d4' }))
      .toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('still works for the historical chat-widget.js filename', async () => {
    expect(await resolveWith({ scriptSrc: 'https://magmacrunch.com/arcade/shared/chat-widget.js' }))
      .toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('falls back to scanning script tags when currentScript is unavailable', async () => {
    expect(await resolveWith({
      scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js?v=9f9f',
      currentScript: false,
    })).toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('lets the caller override the worker URL outright', async () => {
    expect(await resolveWith({
      scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js',
      connectOpts: { workerUrl: 'https://cdn.example.com/w.js' },
    })).toBe('https://cdn.example.com/w.js');
  });

  it('resolves relative to the page when no script tag can be found', async () => {
    expect(await resolveWith({ scriptSrc: null }))
      .toBe('https://magmacrunch.com/arcade/tetris/chat-worker.js');
  });
});

/**
 * Chat server resolution.
 *
 * The widget replays saved credentials as soon as its socket opens, so where
 * that socket points is a privacy question, not just a config one. This package
 * used to hardcode one deployment's hosts as both the fallback and the
 * ?server= allowlist, which meant anyone who installed it and followed the
 * README sent their users' chat to a stranger's server.
 */
describe('chat server resolution', () => {
  const script = 'https://games.example.com/shared/adenosine-chat.js';

  it('defaults to the origin that served the page', async () => {
    expect(await serverFor({ scriptSrc: script, pageUrl: 'https://games.example.com/arcade/tetris/' }))
      .toBe('wss://games.example.com');
  });

  it('follows the page protocol, since an https page cannot open ws:', async () => {
    expect(await serverFor({ scriptSrc: script, pageUrl: 'http://localhost:8000/arcade/tetris/' }))
      .toBe('ws://localhost:8000');
  });

  it('never targets a magmacrunch host without being told to', async () => {
    for (const pageUrl of ['https://games.example.com/a/', 'http://localhost:8000/a/']) {
      expect(await serverFor({ scriptSrc: script, pageUrl })).not.toContain('magmacrunch');
    }
  });

  it('uses an explicit server option', async () => {
    expect(await serverFor({
      scriptSrc: script, pageUrl: 'https://games.example.com/a/',
      connectOpts: { server: 'chat.example.net' },
    })).toBe('wss://chat.example.net');
  });

  it('leaves a fully-qualified server option alone', async () => {
    expect(await serverFor({
      scriptSrc: script, pageUrl: 'https://games.example.com/a/',
      connectOpts: { server: 'wss://chat.example.net/live' },
    })).toBe('wss://chat.example.net/live');
  });

  it('ignores a ?server= naming a host this deployment never declared', async () => {
    expect(await serverFor({
      scriptSrc: script,
      pageUrl: 'https://games.example.com/a/?server=evil.example.org',
    })).toBe('wss://games.example.com');
  });

  it('honours ?server= once the host is allowlisted', async () => {
    expect(await serverFor({
      scriptSrc: script,
      pageUrl: 'https://games.example.com/a/?server=relay.example.net',
      connectOpts: { allowlist: ['relay.example.net'] },
    })).toBe('wss://relay.example.net');
  });
});
