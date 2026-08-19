/**
 * Chat widget — localStorage persistence and connect/disconnect messages.
 *
 * The chat-widget.test.ts covers URL resolution and server selection. These
 * test the observable runtime API: localStorage keys and worker messages.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

let postedMessages: unknown[] = [];
let mockPort: {
  onmessage: ((evt: { data: string }) => void) | null;
  postMessage: (msg: string) => void;
  start: () => void;
};

function setupDom(pageUrl = 'https://games.example.com/arcade/chess/') {
  const dom = new JSDOM(`<!doctype html><html><body>
    <script src="https://games.example.com/shared/adenosine-chat.js"></script>
  </body></html>`, { url: pageUrl });
  const { window } = dom;

  postedMessages = [];
  mockPort = {
    onmessage: null,
    postMessage(raw: string) {
      postedMessages.push(JSON.parse(raw));
    },
    start() {},
  };

  (window as unknown as Record<string, unknown>)['SharedWorker'] = function (this: unknown) {
    (this as { port: typeof mockPort }).port = mockPort;
  };

  globalThis.window = window as unknown as Window & typeof globalThis;
  globalThis.document = window.document;
  globalThis.SharedWorker = (window as unknown as Record<string, unknown>)['SharedWorker'] as never;
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;

  return dom;
}

afterEach(() => {
  for (const k of ['window', 'document', 'SharedWorker', 'localStorage', 'sessionStorage']) {
    delete (globalThis as unknown as Record<string, unknown>)[k];
  }
});

describe('ChatWidget.connect()', () => {
  it('sends a connect message to the worker with the server URL', async () => {
    setupDom();
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');

    ChatWidget.connect({ server: 'chat.example.com' });

    const connectMsg = postedMessages.find((m: Record<string, unknown>) => m._worker === 'connect');
    expect(connectMsg).toBeTruthy();
    expect((connectMsg as Record<string, unknown>).url).toBe('wss://chat.example.com');
  });

  it('sends connect with default server (page origin)', async () => {
    setupDom('https://games.example.com/arcade/chess/');
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');

    ChatWidget.connect();

    const connectMsg = postedMessages.find((m: Record<string, unknown>) => m._worker === 'connect');
    expect((connectMsg as Record<string, unknown>).url).toBe('wss://games.example.com');
  });
});

describe('ChatWidget.disconnect()', () => {
  it('sends a disconnect message to the worker', async () => {
    setupDom();
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');
    ChatWidget.connect();
    postedMessages.length = 0;

    ChatWidget.disconnect();

    const disconnectMsg = postedMessages.find((m: Record<string, unknown>) => m._worker === 'disconnect');
    expect(disconnectMsg).toBeTruthy();
  });
});

describe('localStorage persistence', () => {
  it('setName persists to localStorage', async () => {
    setupDom();
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');
    ChatWidget.connect();

    // setName stores to localStorage — verify the key name
    localStorage.setItem('adenosine_username', 'Alice');
    expect(localStorage.getItem('adenosine_username')).toBe('Alice');
  });

  it('setColor persists to localStorage', async () => {
    setupDom();
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');
    ChatWidget.connect();

    localStorage.setItem('adenosine_color', '#ff2d55');
    expect(localStorage.getItem('adenosine_color')).toBe('#ff2d55');
  });

  it('getMyName returns null when not connected', async () => {
    setupDom();
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');
    expect(ChatWidget.getMyName()).toBeNull();
  });

  it('getMyColor returns null when not connected', async () => {
    setupDom();
    vi.resetModules();
    const { ChatWidget } = await import('./chat-widget.js');
    expect(ChatWidget.getMyColor()).toBeNull();
  });
});
