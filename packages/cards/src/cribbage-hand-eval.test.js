import { describe, it, expect } from 'vitest';
import { CribbageHandEval } from './cribbage-hand-eval.js';

function card(suit, rank) {
  return { suit, rank };
}

describe('CribbageHandEval', () => {
  describe('countFifteens()', () => {
    it('counts 15 from two cards', () => {
      const cards = [card('hearts', '10'), card('diamonds', '5')];
      expect(CribbageHandEval.countFifteens(cards)).toBe(1);
    });

    it('counts multiple 15s', () => {
      const cards = [card('hearts', '10'), card('diamonds', '5'), card('clubs', '5')];
      expect(CribbageHandEval.countFifteens(cards)).toBe(2);
    });

    it('counts face cards as 10', () => {
      const cards = [card('hearts', 'J'), card('diamonds', '5')];
      expect(CribbageHandEval.countFifteens(cards)).toBe(1);
    });

    it('returns 0 when no 15s', () => {
      const cards = [card('hearts', '2'), card('diamonds', '3')];
      expect(CribbageHandEval.countFifteens(cards)).toBe(0);
    });
  });

  describe('countPairs()', () => {
    it('scores 2 for a pair', () => {
      const cards = [card('hearts', '7'), card('diamonds', '7'), card('clubs', '3')];
      expect(CribbageHandEval.countPairs(cards)).toBe(2);
    });

    it('scores 6 for three of a kind', () => {
      const cards = [card('hearts', 'K'), card('diamonds', 'K'), card('clubs', 'K')];
      expect(CribbageHandEval.countPairs(cards)).toBe(6);
    });

    it('scores 12 for four of a kind', () => {
      const cards = [
        card('hearts', 'Q'), card('diamonds', 'Q'),
        card('clubs', 'Q'), card('spades', 'Q'),
      ];
      expect(CribbageHandEval.countPairs(cards)).toBe(12);
    });
  });

  describe('countRuns()', () => {
    it('scores 3 for a 3-card run', () => {
      const cards = [card('hearts', '4'), card('diamonds', '5'), card('clubs', '6')];
      expect(CribbageHandEval.countRuns(cards)).toBe(3);
    });

    it('scores runs within a 4-card sequence', () => {
      // 3-4-5-6 contains: run of 3 (3-4-5) + run of 3 (4-5-6) + run of 4 (3-4-5-6) = 3+3+4 = 10
      const cards = [
        card('hearts', '3'), card('diamonds', '4'),
        card('clubs', '5'), card('spades', '6'),
      ];
      expect(CribbageHandEval.countRuns(cards)).toBe(10);
    });

    it('returns 0 for no run', () => {
      const cards = [card('hearts', '2'), card('diamonds', '5'), card('clubs', '9')];
      expect(CribbageHandEval.countRuns(cards)).toBe(0);
    });
  });

  describe('countFlush()', () => {
    it('scores 4 for 4-card flush in hand', () => {
      const hand = [
        card('hearts', '2'), card('hearts', '5'),
        card('hearts', '8'), card('hearts', 'J'),
      ];
      const starter = card('diamonds', '3');
      expect(CribbageHandEval.countFlush(hand, starter, false)).toBe(4);
    });

    it('scores 5 for 5-card flush', () => {
      const hand = [
        card('hearts', '2'), card('hearts', '5'),
        card('hearts', '8'), card('hearts', 'J'),
      ];
      const starter = card('hearts', '3');
      expect(CribbageHandEval.countFlush(hand, starter, false)).toBe(5);
    });

    it('crib requires all 5 cards for flush', () => {
      const hand = [
        card('hearts', '2'), card('hearts', '5'),
        card('hearts', '8'), card('hearts', 'J'),
      ];
      const starter = card('diamonds', '3');
      expect(CribbageHandEval.countFlush(hand, starter, true)).toBe(0);
    });
  });

  describe('countNobs()', () => {
    it('scores 1 for Jack matching starter suit', () => {
      const hand = [card('hearts', 'J'), card('diamonds', '5'), card('clubs', '8'), card('spades', '2')];
      const starter = card('hearts', '3');
      expect(CribbageHandEval.countNobs(hand, starter)).toBe(1);
    });

    it('returns 0 when no nobs', () => {
      const hand = [card('hearts', 'Q'), card('diamonds', '5'), card('clubs', '8'), card('spades', '2')];
      const starter = card('hearts', '3');
      expect(CribbageHandEval.countNobs(hand, starter)).toBe(0);
    });
  });

  describe('scoreHand()', () => {
    it('scores a complete hand', () => {
      const hand = [
        card('hearts', '5'), card('hearts', 'J'),
        card('hearts', '10'), card('diamonds', '5'),
      ];
      const starter = card('hearts', '5');
      const result = CribbageHandEval.scoreHand(hand, starter);
      expect(result.total).toBeGreaterThan(0);
      expect(result.breakdown).toHaveProperty('fifteens');
      expect(result.breakdown).toHaveProperty('pairs');
      expect(result.breakdown).toHaveProperty('runs');
      expect(result.breakdown).toHaveProperty('flush');
      expect(result.breakdown).toHaveProperty('nobs');
    });
  });

  describe('scorePeggingPlay()', () => {
    it('scores 15 during pegging', () => {
      const card1 = card('hearts', '10');
      const card2 = card('diamonds', '5');
      const result = CribbageHandEval.scorePeggingPlay(card2, [card1]);
      expect(result.points).toBe(2);
      expect(result.description).toContain('Fifteen');
    });

    it('scores pair during pegging', () => {
      const card1 = card('hearts', '8');
      const card2 = card('diamonds', '8');
      const result = CribbageHandEval.scorePeggingPlay(card2, [card1]);
      expect(result.points).toBe(2);
      expect(result.description).toContain('Pair');
    });

    it('scores 31', () => {
      // 10 + 5 + 6 = 21, then play a 10 → total = 31
      const played = [
        card('hearts', '10'), card('diamonds', '5'), card('clubs', '6'),
      ];
      const card1 = card('spades', '10');
      const result = CribbageHandEval.scorePeggingPlay(card1, played);
      expect(result.points).toBe(2);
      expect(result.description).toContain('Thirty-one');
    });
  });
});
