/**
 * score-client — Persistent high scores via WebSocket backend
 *
 * Connects to a WebSocket server for high score persistence.
 * Falls back to localStorage when the server is unreachable.
 * Auto-syncs queued saves when connection is restored.
 */

import type { ScoreEntry, SaveResult, ScoreClientOptions } from './types.js';

const LS_PREFIX = 'adenosine_scores_';
const RECONNECT_DELAY = 3000;
const REQUEST_TIMEOUT = 5000;
const DEFAULT_PORT = 8781;

export class ScoreClient {
  private ws: WebSocket | null = null;
  private _url = '';
  private _connected = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private idCounter = 0;
  private pendingSaves: Array<{ game: string; name: string; score: number; extra?: Record<string, unknown> }> = [];
  private listeners: Array<(data: Record<string, unknown>) => void> = [];

  private pendingKey = LS_PREFIX + '_pending';

  constructor() {
    this.pendingSaves = this.lsLoadPending();
  }

  // ── localStorage helpers ──────────────────────────────────────

  private lsLoadPending(): Array<{ game: string; name: string; score: number; extra?: Record<string, unknown> }> {
    try {
      const raw = localStorage.getItem(this.pendingKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private lsSavePending(): void {
    try {
      localStorage.setItem(this.pendingKey, JSON.stringify(this.pendingSaves));
    } catch {
      // storage full
    }
  }

  private lsKey(game: string): string {
    return LS_PREFIX + game;
  }

  private lsLoad(game: string): ScoreEntry[] {
    try {
      const raw = localStorage.getItem(this.lsKey(game));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private lsSave(game: string, scores: ScoreEntry[]): void {
    try {
      localStorage.setItem(this.lsKey(game), JSON.stringify(scores));
    } catch {
      // storage full — silently drop
    }
  }

  // ── WebSocket helpers ─────────────────────────────────────────

  private send(msg: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('not connected'));
        return;
      }
      const id = ++this.idCounter;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('timeout'));
      }, REQUEST_TIMEOUT);
      this.pending.set(id, { resolve, reject, timer });
      msg._id = id;
      this.ws.send(JSON.stringify(msg));
    });
  }

  private handleMessage(evt: MessageEvent): void {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }

    // Handle score responses
    const id = data._id as number | undefined;
    if (id && this.pending.has(id)) {
      const p = this.pending.get(id)!;
      clearTimeout(p.timer);
      this.pending.delete(id);
      p.resolve(data);
      return;
    }

    // Notify listeners
    for (const fn of this.listeners) {
      try { fn(data); } catch { /* listener error */ }
    }
  }

  private connectWs(url: string): void {
    this._url = url;
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
    }
    try {
      this.ws = new WebSocket(url);
    } catch {
      this._connected = false;
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this._connected = true;
      this.flushPendingSaves();
    };

    this.ws.onmessage = (evt) => this.handleMessage(evt);

    this.ws.onclose = () => {
      this._connected = false;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this._connected = false;
    };
  }

  private scheduleReconnect(): void {
    setTimeout(() => {
      if (!this._connected && this._url) {
        this.connectWs(this._url);
      }
    }, RECONNECT_DELAY);
  }

  private async flushPendingSaves(): Promise<void> {
    while (this.pendingSaves.length > 0) {
      const save = this.pendingSaves.shift()!;
      this.lsSavePending();
      try {
        await this.send({
          action: 'score_save',
          game: save.game,
          name: save.name,
          score: save.score,
          extra: save.extra,
        });
      } catch {
        this.pendingSaves.unshift(save);
        this.lsSavePending();
        break;
      }
    }
    if (this.pendingSaves.length === 0) {
      try { localStorage.removeItem(this.pendingKey); } catch { /* ignore */ }
    }
  }

  // ── Public API ────────────────────────────────────────────────

  /**
   * Connect to a specific WebSocket URL.
   */
  connect(url: string): this {
    this.connectWs(url);
    return this;
  }

  /**
   * Auto-detect the admin server from window.location.
   * Falls back to 'ws://localhost:8781'.
   *
   * The scheme follows the page protocol: an HTTPS page gets `wss:`, because
   * browsers block a `ws:` connection from a secure page as mixed content
   * before it reaches the network. Pass `secure` to override that, or `url`
   * to bypass the whole construction.
   */
  auto(opts?: ScoreClientOptions): this {
    if (opts?.url) {
      this.connect(opts.url);
      return this;
    }

    const loc = typeof window !== 'undefined' ? window.location : undefined;
    const hostname = opts?.hostname ?? (loc?.hostname || 'localhost');
    // `undefined` means "unset, use the default"; an explicit `null` means
    // "omit the port", which a proxy on 443 needs.
    const port = opts?.port === undefined ? DEFAULT_PORT : opts.port;
    const secure = opts?.secure ?? loc?.protocol === 'https:';
    const scheme = secure ? 'wss' : 'ws';

    let path = opts?.path ?? '';
    if (path && !path.startsWith('/')) path = '/' + path;

    this.connect(`${scheme}://${hostname}${port == null ? '' : ':' + port}${path}`);
    return this;
  }

  /**
   * Check if currently connected to the backend.
   */
  get isConnected(): boolean {
    return this._connected;
  }

  /**
   * Register a listener for incoming WebSocket messages.
   * Returns an unsubscribe function.
   */
  onMessage(fn: (data: Record<string, unknown>) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }

  /**
   * Load scores for a game. Tries backend first, falls back to localStorage.
   */
  async load(game: string): Promise<ScoreEntry[]> {
    if (this._connected) {
      try {
        const res = await this.send({ action: 'score_load', game });
        const scores = (res.scores as ScoreEntry[]) || [];
        this.lsSave(game, scores);
        return scores;
      } catch {
        // fall through to localStorage
      }
    }
    return this.lsLoad(game);
  }

  /**
   * Save a score for a game.
   *
   * The returned `rank` is the score's 1-based position among all locally
   * known scores for the game, so it stays meaningful even when the score
   * falls outside the top 100 that get persisted.
   */
  async save(
    game: string,
    name: string,
    score: number,
    extra?: Record<string, unknown>,
  ): Promise<SaveResult> {
    // Always update localStorage immediately
    const scores = this.lsLoad(game);
    const entry: ScoreEntry = { initials: name.toUpperCase().slice(0, 3), score };
    if (extra) Object.assign(entry, extra);
    scores.push(entry);
    scores.sort((a, b) => (b.score || 0) - (a.score || 0));
    // Rank against the full sorted list, not the truncated one — indexing into
    // `top` returns 0 for any score that misses the top 100.
    const rank = scores.indexOf(entry) + 1;

    this.lsSave(game, scores.slice(0, 100));

    if (this._connected) {
      try {
        await this.send({ action: 'score_save', game, name, score, extra });
        return { rank, synced: true };
      } catch {
        // queued below
      }
    }

    // Queue for later sync
    this.pendingSaves.push({ game, name, score, extra });
    this.lsSavePending();
    return { rank, synced: false };
  }

  /**
   * Load all game scores (admin dashboard use).
   */
  async loadAll(): Promise<Record<string, { game: string; scores: ScoreEntry[] }>> {
    if (this._connected) {
      try {
        const res = await this.send({ action: 'scores_all' });
        return (res.games as Record<string, { game: string; scores: ScoreEntry[] }>) || {};
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Reset scores for a game.
   */
  async reset(game: string): Promise<void> {
    this.lsSave(game, []);
    if (this._connected) {
      try {
        await this.send({ action: 'score_reset', game });
      } catch { /* ignore */ }
    }
  }
}
