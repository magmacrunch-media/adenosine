/**
 * Score tracking with localStorage persistence.
 */

export interface ScoreEntry {
  score: number;
  difficulty: string;
  date: string;
  moves: number;
  time: number;
  highestTile: number;
}

export interface PuzzleScoringConfig {
  ascending?: boolean;
}

export interface PuzzleScoring {
  addScore(score: number, difficulty: string, metadata?: Partial<Pick<ScoreEntry, 'moves' | 'time' | 'highestTile'>>): number;
  getRank(score: number, difficulty?: string): number;
  getTopScores(difficulty?: string, limit?: number): ScoreEntry[];
  isNewHighScore(score: number, difficulty?: string): boolean;
  getDifficulties(): string[];
  clearScores(): void;
}

export function create(gameName: string, config: PuzzleScoringConfig = {}): PuzzleScoring {
  const storageKey = gameName + '_scores';
  const ascending = config.ascending ?? false;
  let scores: ScoreEntry[] = loadScores();

  function loadScores(): ScoreEntry[] {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveScores(): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(scores));
    } catch {
      // storage full
    }
  }

  function addScore(
    score: number,
    difficulty: string,
    metadata: Partial<Pick<ScoreEntry, 'moves' | 'time' | 'highestTile'>> = {},
  ): number {
    const entry: ScoreEntry = {
      score,
      difficulty,
      date: new Date().toISOString(),
      moves: metadata.moves ?? 0,
      time: metadata.time ?? 0,
      highestTile: metadata.highestTile ?? 0,
    };
    scores.push(entry);
    scores.sort((a, b) => ascending ? a.score - b.score : b.score - a.score);
    scores = scores.slice(0, 100);
    saveScores();
    return getRank(score, difficulty);
  }

  function getRank(score: number, difficulty?: string): number {
    const filtered = difficulty
      ? scores.filter((s) => s.difficulty === difficulty)
      : scores;
    for (let i = 0; i < filtered.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entry = filtered[i]!;
      if (ascending ? score <= entry.score : score >= entry.score) return i + 1;
    }
    return filtered.length + 1;
  }

  function getTopScores(difficulty?: string, limit = 10): ScoreEntry[] {
    const filtered = difficulty
      ? scores.filter((s) => s.difficulty === difficulty)
      : scores;
    return filtered.slice(0, limit);
  }

  function isNewHighScore(score: number, difficulty?: string): boolean {
    const topScores = getTopScores(difficulty, 10);
    if (topScores.length < 10) return true;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const last = topScores[topScores.length - 1]!;
    return ascending ? score < last.score : score > last.score;
  }

  function getDifficulties(): string[] {
    const diffMap: Record<string, boolean> = {};
    scores.forEach((s) => {
      if (s.difficulty) diffMap[s.difficulty] = true;
    });
    return Object.keys(diffMap);
  }

  function clearScores(): void {
    scores = [];
    saveScores();
  }

  return {
    addScore,
    getRank,
    getTopScores,
    isNewHighScore,
    getDifficulties,
    clearScores,
  };
}
