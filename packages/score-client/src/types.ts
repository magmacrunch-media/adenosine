export interface ScoreEntry {
  initials: string;
  score: number;
  [key: string]: unknown;
}

export interface SaveResult {
  rank: number;
  synced: boolean;
}

export interface ScoreClientOptions {
  /** Full WebSocket URL. When set, every other option is ignored. */
  url?: string;
  /** Host to connect to. Defaults to the page's hostname. */
  hostname?: string;
  /**
   * Port to connect to. Defaults to 8781. Pass `null` to omit the port
   * entirely, which is what you want when a TLS reverse proxy fronts the
   * socket on the default 443.
   */
  port?: number | null;
  /**
   * Force the `wss:` (true) or `ws:` (false) scheme. Defaults to matching the
   * page protocol.
   */
  secure?: boolean;
  /** Path on the host, e.g. `/scores` when proxied. Defaults to none. */
  path?: string;
}
