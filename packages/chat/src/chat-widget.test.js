/**
 * Worker URL resolution.
 *
 * The SharedWorker is the point of this package — it holds one socket across
 * page navigations. Resolution used to scan for a <script> tag named literally
 * 'chat-widget.js', which broke twice over: tsup renames the bundle, and the
 * arcade appends ?v= cache-busters. Both misses fell back to a page-relative
 * guess, so the worker never loaded and the widget quietly degraded to a
 * per-page socket. These tests pin the cases that regressed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('./chat-widget.js', import.meta.url), 'utf8');

/**
 * Evaluate chat-widget.js in a fresh DOM with a given loading <script>, then
 * report the worker URL it would construct.
 */
function resolveWith({ scriptSrc, pageUrl = 'https://magmacrunch.com/arcade/tetris/', currentScript = true, connectOpts }) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: pageUrl,
    runScripts: 'outside-only', // gives window.eval a real window realm
  });
  const { window } = dom;

  if (scriptSrc) {
    const el = window.document.createElement('script');
    el.src = scriptSrc;
    window.document.body.appendChild(el);
    if (currentScript) {
      Object.defineProperty(window.document, 'currentScript', { value: el, configurable: true });
    }
  }

  let requested = null;
  window.SharedWorker = function (url) {
    requested = url;
    this.port = { onmessage: null, start() {}, postMessage() {} };
  };

  // Run the module body, then drive connect() to force resolution.
  const body = SRC.replace(/export\s*\{\s*ChatWidget\s*\};?/, 'window.__ChatWidget = ChatWidget;');
  window.eval(body);
  window.__ChatWidget.connect(connectOpts);
  return requested;
}

describe('SharedWorker URL resolution', () => {
  it('derives the worker from the tag that loaded the bundle, whatever it is named', () => {
    expect(resolveWith({ scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js' }))
      .toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('survives a ?v= cache-buster on the script src', () => {
    expect(resolveWith({ scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js?v=a1b2c3d4' }))
      .toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('still works for the historical chat-widget.js filename', () => {
    expect(resolveWith({ scriptSrc: 'https://magmacrunch.com/arcade/shared/chat-widget.js' }))
      .toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('falls back to scanning script tags when currentScript is unavailable', () => {
    expect(resolveWith({
      scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js?v=9f9f',
      currentScript: false,
    })).toBe('https://magmacrunch.com/arcade/shared/chat-worker.js');
  });

  it('lets the caller override the worker URL outright', () => {
    expect(resolveWith({
      scriptSrc: 'https://magmacrunch.com/arcade/shared/adenosine-chat.js',
      connectOpts: { workerUrl: 'https://cdn.example.com/w.js' },
    })).toBe('https://cdn.example.com/w.js');
  });

  it('resolves relative to the page when no script tag can be found', () => {
    expect(resolveWith({ scriptSrc: null }))
      .toBe('https://magmacrunch.com/arcade/tetris/chat-worker.js');
  });
});
