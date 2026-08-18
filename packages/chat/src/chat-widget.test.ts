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

/**
 * Stand up a page with a given loading <script>, import the widget into it, and
 * report the URL it hands to SharedWorker.
 */
async function resolveWith(opts: {
  scriptSrc?: string | null;
  pageUrl?: string;
  currentScript?: boolean;
  connectOpts?: { workerUrl?: string };
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
  (window as unknown as Record<string, unknown>)['SharedWorker'] =
    function (this: unknown, url: string) {
      requestedWorkerUrl = url;
      (this as { port: unknown }).port = {
        onmessage: null, start() {}, postMessage() {},
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
