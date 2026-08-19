import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScoreClient } from './score-client.js';

// ── Mock localStorage ───────────────────────────────────────────

const localStorageStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }),
  get length() { return Object.keys(localStorageStore).length; },
  key: vi.fn((i: number) => Object.keys(localStorageStore)[i] ?? null),
};

vi.stubGlobal('localStorage', mockLocalStorage);

// ── Mock WebSocket ──────────────────────────────────────────────

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;

  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((evt: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; }

  simulateOpen() { this.readyState = 1; this.onopen?.(); }
  simulateMessage(data: Record<string, unknown>) { this.onmessage?.({ data: JSON.stringify(data) }); }
  simulateClose() { this.readyState = 3; this.onclose?.(); }
  simulateError() { this.onerror?.(); }
}

vi.stubGlobal('WebSocket', MockWebSocket);

// ── Scoped window stub ──────────────────────────────────────────
// The default vitest environment is node, so `window` is absent. These tests
// install one only for the duration of a call — using vi.unstubAllGlobals()
// here would also tear down the localStorage and WebSocket stubs above.

function withWindow(
  location: { protocol?: string; hostname?: string },
  fn: () => void,
): void {
  const g = globalThis as Record<string, unknown>;
  const had = 'window' in g;
  const prev = g.window;
  g.window = { location };
  try {
    fn();
  } finally {
    if (had) g.window = prev;
    else delete g.window;
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('ScoreClient', () => {
  let client: ScoreClient;

  beforeEach(() => {
    MockWebSocket.instances = [];
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    client = new ScoreClient();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('connect()', () => {
    it('creates a WebSocket connection', () => {
      client.connect('ws://localhost:8781');
      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8781');
    });

    it('returns this for chaining', () => {
      const result = client.connect('ws://localhost:8781');
      expect(result).toBe(client);
    });

    it('sets isConnected to true on open', () => {
      client.connect('ws://localhost:8781');
      expect(client.isConnected).toBe(false);
      MockWebSocket.instances[0].simulateOpen();
      expect(client.isConnected).toBe(true);
    });

    it('sets isConnected to false on close', () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();
      expect(client.isConnected).toBe(true);
      MockWebSocket.instances[0].simulateClose();
      expect(client.isConnected).toBe(false);
    });
  });

  describe('auto()', () => {
    it('auto-detects host from window.location', () => {
      client.auto();
      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].url).toMatch(/^ws:\/\/.*:8781$/);
    });

    it('accepts custom port', () => {
      client.auto({ port: 9999 });
      expect(MockWebSocket.instances[0].url).toContain(':9999');
    });

    it('accepts custom hostname', () => {
      client.auto({ hostname: 'mypi.local' });
      expect(MockWebSocket.instances[0].url).toBe('ws://mypi.local:8781');
    });

    it('returns this for chaining', () => {
      const result = client.auto();
      expect(result).toBe(client);
    });

    it('falls back to localhost when there is no window', () => {
      client.auto();
      expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8781');
    });

    // Regression: a ws:// URL opened from an HTTPS page is blocked by the
    // browser as mixed content, which silently killed every arcade score sync.
    it('uses wss on an https page', () => {
      withWindow({ protocol: 'https:', hostname: 'magmacrunch.com' }, () => {
        client.auto();
      });
      expect(MockWebSocket.instances[0].url).toBe('wss://magmacrunch.com:8781');
    });

    it('uses ws on an http page', () => {
      withWindow({ protocol: 'http:', hostname: 'magmacrunch.local' }, () => {
        client.auto();
      });
      expect(MockWebSocket.instances[0].url).toBe('ws://magmacrunch.local:8781');
    });

    it('honours secure: true on an http page', () => {
      withWindow({ protocol: 'http:', hostname: 'pi.local' }, () => {
        client.auto({ secure: true });
      });
      expect(MockWebSocket.instances[0].url).toBe('wss://pi.local:8781');
    });

    it('honours secure: false on an https page', () => {
      withWindow({ protocol: 'https:', hostname: 'pi.local' }, () => {
        client.auto({ secure: false });
      });
      expect(MockWebSocket.instances[0].url).toBe('ws://pi.local:8781');
    });

    it('keeps the page scheme when only hostname is overridden', () => {
      withWindow({ protocol: 'https:', hostname: 'magmacrunch.com' }, () => {
        client.auto({ hostname: 'magmacrunch.duckdns.org' });
      });
      expect(MockWebSocket.instances[0].url).toBe('wss://magmacrunch.duckdns.org:8781');
    });

    it('omits the port when port is null', () => {
      withWindow({ protocol: 'https:', hostname: 'magmacrunch.duckdns.org' }, () => {
        client.auto({ port: null, path: '/scores' });
      });
      expect(MockWebSocket.instances[0].url).toBe('wss://magmacrunch.duckdns.org/scores');
    });

    it('adds a missing leading slash to path', () => {
      client.auto({ hostname: 'pi.local', port: null, path: 'scores' });
      expect(MockWebSocket.instances[0].url).toBe('ws://pi.local/scores');
    });

    it('url overrides every other option', () => {
      withWindow({ protocol: 'https:', hostname: 'magmacrunch.com' }, () => {
        client.auto({ url: 'ws://127.0.0.1:9999', hostname: 'ignored', port: 1 });
      });
      expect(MockWebSocket.instances[0].url).toBe('ws://127.0.0.1:9999');
    });
  });

  describe('load()', () => {
    it('loads from localStorage when offline', async () => {
      localStorageStore['adenosine_scores_tetris'] = JSON.stringify([
        { initials: 'JAM', score: 1000 },
      ]);
      const scores = await client.load('tetris');
      expect(scores).toEqual([{ initials: 'JAM', score: 1000 }]);
    });

    it('returns empty array when no cached data', async () => {
      const scores = await client.load('nonexistent');
      expect(scores).toEqual([]);
    });

    it('loads from backend when connected', async () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      const loadPromise = client.load('tetris');
      const sent = JSON.parse(MockWebSocket.instances[0].sent[0]);
      MockWebSocket.instances[0].simulateMessage({
        _id: sent._id,
        scores: [{ initials: 'BOT', score: 5000 }],
      });

      const scores = await loadPromise;
      expect(scores).toEqual([{ initials: 'BOT', score: 5000 }]);
    });

    it('caches backend response to localStorage', async () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      const loadPromise = client.load('tetris');
      const sent = JSON.parse(MockWebSocket.instances[0].sent[0]);
      MockWebSocket.instances[0].simulateMessage({
        _id: sent._id,
        scores: [{ initials: 'BOT', score: 5000 }],
      });

      await loadPromise;
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adenosine_scores_tetris',
        expect.any(String),
      );
    });
  });

  describe('save()', () => {
    it('saves to localStorage immediately', async () => {
      await client.save('tetris', 'JAM', 12400);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adenosine_scores_tetris',
        expect.stringContaining('JAM'),
      );
    });

    it('uppercases initials and truncates to 3 chars', async () => {
      await client.save('tetris', 'jake', 100);
      const call = mockLocalStorage.setItem.mock.calls.find(
        (c: unknown[]) => (c as string[])[0] === 'adenosine_scores_tetris',
      );
      expect(call).toBeDefined();
      const scores = JSON.parse((call as unknown[])[1] as string);
      expect(scores[0].initials).toBe('JAK');
    });

    it('returns correct rank', async () => {
      await client.save('tetris', 'LOW', 100);
      const result = await client.save('tetris', 'HIGH', 999);
      expect(result.rank).toBe(1);
    });

    it('returns synced: false when offline', async () => {
      const result = await client.save('tetris', 'JAM', 100);
      expect(result.synced).toBe(false);
    });

    it('queues save for later sync when offline', async () => {
      await client.save('tetris', 'JAM', 100);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adenosine_scores__pending',
        expect.stringContaining('tetris'),
      );
    });

    it('includes extra fields in entry', async () => {
      await client.save('tetris', 'JAM', 100, { level: 5 });
      const call = mockLocalStorage.setItem.mock.calls.find(
        (c: unknown[]) => (c as string[])[0] === 'adenosine_scores_tetris',
      );
      expect(call).toBeDefined();
      const scores = JSON.parse((call as unknown[])[1] as string);
      expect(scores[0].level).toBe(5);
    });

    it('syncs to backend when connected', async () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      const savePromise = client.save('tetris', 'JAM', 100);
      const sent = JSON.parse(MockWebSocket.instances[0].sent[0]);
      MockWebSocket.instances[0].simulateMessage({
        _id: sent._id,
        rank: 1,
      });

      const result = await savePromise;
      expect(result.synced).toBe(true);
    });
  });

  describe('reset()', () => {
    it('clears localStorage for game', async () => {
      await client.reset('tetris');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adenosine_scores_tetris',
        '[]',
      );
    });

    it('sends reset to backend when connected', async () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      const resetPromise = client.reset('tetris');
      const sent = JSON.parse(MockWebSocket.instances[0].sent[0]);
      MockWebSocket.instances[0].simulateMessage({ _id: sent._id });

      await resetPromise;
      expect(sent.action).toBe('score_reset');
      expect(sent.game).toBe('tetris');
    });
  });

  describe('onMessage()', () => {
    it('receives unsolicited messages', () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      const listener = vi.fn();
      client.onMessage(listener);

      MockWebSocket.instances[0].simulateMessage({ type: 'broadcast', text: 'hello' });
      expect(listener).toHaveBeenCalledWith({ type: 'broadcast', text: 'hello' });
    });

    it('returns unsubscribe function', () => {
      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      const listener = vi.fn();
      const unsub = client.onMessage(listener);
      unsub();

      MockWebSocket.instances[0].simulateMessage({ type: 'test' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('pending saves flush', () => {
    it('flushes queued saves on reconnect', async () => {
      await client.save('tetris', 'JAM', 100);

      client.connect('ws://localhost:8781');
      MockWebSocket.instances[0].simulateOpen();

      await vi.advanceTimersByTimeAsync(100);

      expect(MockWebSocket.instances[0].sent.length).toBeGreaterThan(0);
      const sent = JSON.parse(MockWebSocket.instances[0].sent[0]);
      expect(sent.action).toBe('score_save');
      expect(sent.game).toBe('tetris');
    });
  });
});
