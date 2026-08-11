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
  port?: number;
  hostname?: string;
}
