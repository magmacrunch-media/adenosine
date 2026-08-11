import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create as createScoring } from './puzzle-scoring.js';

// Mock localStorage
const localStorageStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('PuzzleScoring', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  describe('addScore()', () => {
    it('stores a score entry', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'normal');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('returns rank', () => {
      const scoring = createScoring('test-game');
      const rank = scoring.addScore(100, 'normal');
      expect(rank).toBe(1);
    });

    it('sorts scores descending by default', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'normal');
      scoring.addScore(200, 'normal');
      scoring.addScore(50, 'normal');
      const top = scoring.getTopScores();
      expect(top[0].score).toBe(200);
      expect(top[1].score).toBe(100);
      expect(top[2].score).toBe(50);
    });

    it('sorts ascending when configured', () => {
      const scoring = createScoring('test-game', { ascending: true });
      scoring.addScore(100, 'normal');
      scoring.addScore(200, 'normal');
      scoring.addScore(50, 'normal');
      const top = scoring.getTopScores();
      expect(top[0].score).toBe(50);
      expect(top[1].score).toBe(100);
      expect(top[2].score).toBe(200);
    });

    it('keeps top 100 scores', () => {
      const scoring = createScoring('test-game');
      for (let i = 0; i < 105; i++) {
        scoring.addScore(i, 'normal');
      }
      const top = scoring.getTopScores(undefined, 200);
      expect(top.length).toBe(100);
    });
  });

  describe('getRank()', () => {
    it('returns 1-based rank', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'normal');
      scoring.addScore(200, 'normal');
      expect(scoring.getRank(200, 'normal')).toBe(1);
      expect(scoring.getRank(100, 'normal')).toBe(2);
    });

    it('filters by difficulty', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'easy');
      scoring.addScore(200, 'hard');
      expect(scoring.getRank(100, 'easy')).toBe(1);
      expect(scoring.getRank(100, 'hard')).toBe(2);
    });
  });

  describe('getTopScores()', () => {
    it('returns top N scores', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'normal');
      scoring.addScore(200, 'normal');
      scoring.addScore(50, 'normal');
      const top = scoring.getTopScores(undefined, 2);
      expect(top).toHaveLength(2);
      expect(top[0].score).toBe(200);
    });

    it('filters by difficulty', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'easy');
      scoring.addScore(200, 'hard');
      const easy = scoring.getTopScores('easy');
      expect(easy).toHaveLength(1);
      expect(easy[0].score).toBe(100);
    });
  });

  describe('isNewHighScore()', () => {
    it('returns true when fewer than 10 scores', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'normal');
      expect(scoring.isNewHighScore(50, 'normal')).toBe(true);
    });

    it('returns true when score beats 10th place', () => {
      const scoring = createScoring('test-game');
      for (let i = 0; i < 10; i++) {
        scoring.addScore(i * 100, 'normal');
      }
      expect(scoring.isNewHighScore(999, 'normal')).toBe(true);
    });
  });

  describe('getDifficulties()', () => {
    it('returns unique difficulties', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'easy');
      scoring.addScore(200, 'hard');
      scoring.addScore(50, 'easy');
      expect(scoring.getDifficulties()).toEqual(expect.arrayContaining(['easy', 'hard']));
    });
  });

  describe('clearScores()', () => {
    it('removes all scores', () => {
      const scoring = createScoring('test-game');
      scoring.addScore(100, 'normal');
      scoring.clearScores();
      expect(scoring.getTopScores()).toHaveLength(0);
    });
  });
});
