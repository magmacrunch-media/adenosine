import { describe, it, expect } from 'vitest';
import { HandEvaluator } from './hand-eval.js';

function card(suit, rank, value) {
  return { suit, rank, value };
}

const evaluator = new HandEvaluator();

describe('HandEvaluator', () => {
  describe('evaluate()', () => {
    it('returns empty result for null/empty input', () => {
      expect(evaluator.evaluate(null).name).toBe('No Cards');
      expect(evaluator.evaluate([]).name).toBe('No Cards');
    });

    it('returns partial result for fewer than 5 cards', () => {
      const result = evaluator.evaluate([card('hearts', 'A', 14), card('hearts', 'K', 13)]);
      expect(result.partial).toBe(true);
      expect(result.name).toBe('High Card');
    });
  });

  describe('Royal Flush', () => {
    it('detects royal flush', () => {
      const cards = [
        card('hearts', '10', 10),
        card('hearts', 'J', 11),
        card('hearts', 'Q', 12),
        card('hearts', 'K', 13),
        card('hearts', 'A', 14),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Royal Flush');
      expect(result.rank).toBe(9);
    });
  });

  describe('Straight Flush', () => {
    it('detects straight flush', () => {
      const cards = [
        card('clubs', '5', 5),
        card('clubs', '6', 6),
        card('clubs', '7', 7),
        card('clubs', '8', 8),
        card('clubs', '9', 9),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Straight Flush');
      expect(result.rank).toBe(8);
    });
  });

  describe('Four of a Kind', () => {
    it('detects four of a kind', () => {
      const cards = [
        card('hearts', '7', 7),
        card('diamonds', '7', 7),
        card('clubs', '7', 7),
        card('spades', '7', 7),
        card('hearts', '2', 2),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Four of a Kind');
      expect(result.rank).toBe(7);
    });
  });

  describe('Full House', () => {
    it('detects full house', () => {
      const cards = [
        card('hearts', '9', 9),
        card('diamonds', '9', 9),
        card('clubs', '9', 9),
        card('spades', '4', 4),
        card('hearts', '4', 4),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Full House');
      expect(result.rank).toBe(6);
    });
  });

  describe('Flush', () => {
    it('detects flush', () => {
      const cards = [
        card('spades', '2', 2),
        card('spades', '5', 5),
        card('spades', '8', 8),
        card('spades', 'J', 11),
        card('spades', '3', 3),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Flush');
      expect(result.rank).toBe(5);
    });
  });

  describe('Straight', () => {
    it('detects straight', () => {
      const cards = [
        card('hearts', '9', 9),
        card('diamonds', '10', 10),
        card('clubs', 'J', 11),
        card('spades', 'Q', 12),
        card('hearts', 'K', 13),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Straight');
      expect(result.rank).toBe(4);
    });

    it('detects wheel (A-2-3-4-5)', () => {
      const cards = [
        card('hearts', 'A', 14),
        card('diamonds', '2', 2),
        card('clubs', '3', 3),
        card('spades', '4', 4),
        card('hearts', '5', 5),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Straight');
    });
  });

  describe('Three of a Kind', () => {
    it('detects three of a kind', () => {
      const cards = [
        card('hearts', 'J', 11),
        card('diamonds', 'J', 11),
        card('clubs', 'J', 11),
        card('spades', '3', 3),
        card('hearts', '7', 7),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Three of a Kind');
      expect(result.rank).toBe(3);
    });
  });

  describe('Two Pair', () => {
    it('detects two pair', () => {
      const cards = [
        card('hearts', '8', 8),
        card('diamonds', '8', 8),
        card('clubs', '5', 5),
        card('spades', '5', 5),
        card('hearts', 'K', 13),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Two Pair');
      expect(result.rank).toBe(2);
    });
  });

  describe('One Pair', () => {
    it('detects one pair', () => {
      const cards = [
        card('hearts', 'Q', 12),
        card('diamonds', 'Q', 12),
        card('clubs', '3', 3),
        card('spades', '7', 7),
        card('hearts', '9', 9),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('One Pair');
      expect(result.rank).toBe(1);
    });
  });

  describe('High Card', () => {
    it('detects high card', () => {
      const cards = [
        card('hearts', '2', 2),
        card('diamonds', '5', 5),
        card('clubs', '8', 8),
        card('spades', 'J', 11),
        card('hearts', '3', 3),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('High Card');
      expect(result.rank).toBe(0);
    });
  });

  describe('7-card hand (Texas Hold\'Em)', () => {
    it('picks best 5 from 7', () => {
      const cards = [
        card('hearts', 'A', 14),
        card('hearts', 'K', 13),
        card('hearts', 'Q', 12),
        card('hearts', 'J', 11),
        card('hearts', '10', 10),
        card('diamonds', '3', 3),
        card('clubs', '7', 7),
      ];
      const result = evaluator.evaluate(cards);
      expect(result.name).toBe('Royal Flush');
    });
  });

  describe('tiebreakers', () => {
    it('higher pair wins', () => {
      const hand1 = evaluator.evaluate([
        card('hearts', 'K', 13), card('diamonds', 'K', 13),
        card('clubs', '2', 2), card('spades', '5', 5), card('hearts', '9', 9),
      ]);
      const hand2 = evaluator.evaluate([
        card('hearts', 'Q', 12), card('diamonds', 'Q', 12),
        card('clubs', 'A', 14), card('spades', 'J', 11), card('hearts', '8', 8),
      ]);
      expect(hand1.rank).toBe(hand2.rank); // both One Pair
      expect(hand1.tiebreakers[0]).toBeGreaterThan(hand2.tiebreakers[0]);
    });
  });
});
