import { describe, it, expect } from 'vitest';
import { CribbageHandEval } from './cribbage-hand-eval.js';

// These mirror arcade/cribbage/tests/test-scoring.js on the website, which was
// written against a standalone scorer precisely because this one built runs out
// of the counting value (J-Q-K scored nothing) and paid every sub-run of a
// sequence (2-3-4-5 paid 10). The cases that told the two apart are kept
// together in the run and pegging blocks below.
//
// One deliberate difference from that file: `countFifteens` here returns the
// number of combinations, not the points, so its expectations are half the
// website's.

function card(suit, rank) {
  return { suit, rank };
}

// 'KH' -> king of hearts. Suits are h/d/c/s.
const SUITS = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
function c(text) {
  return { rank: text.slice(0, -1), suit: SUITS[text.slice(-1)] };
}
function hand(...texts) {
  return texts.map(c);
}

describe('CribbageHandEval', () => {
  describe('value() and order()', () => {
    it('counts an ace as one', () => {
      expect(CribbageHandEval.value('A')).toBe(1);
    });

    it('counts every court card as ten', () => {
      expect(CribbageHandEval.value('J')).toBe(10);
      expect(CribbageHandEval.value('Q')).toBe(10);
      expect(CribbageHandEval.value('K')).toBe(10);
    });

    it('orders court cards above the ten and apart from each other', () => {
      expect(CribbageHandEval.order('10')).toBe(10);
      expect(CribbageHandEval.order('J')).toBe(11);
      expect(CribbageHandEval.order('Q')).toBe(12);
      expect(CribbageHandEval.order('K')).toBe(13);
    });

    it('orders an ace low', () => {
      expect(CribbageHandEval.order('A')).toBe(1);
    });
  });

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

    it('does not count a king as thirteen', () => {
      expect(CribbageHandEval.countFifteens(hand('Kh', '2s'))).toBe(0);
    });

    it('counts A-2-3-4-5 once', () => {
      expect(CribbageHandEval.countFifteens(hand('Ah', '2s', '3d', '4c', '5h'))).toBe(1);
    });

    it('counts four court cards and a five four ways', () => {
      expect(CribbageHandEval.countFifteens(hand('Jh', 'Qs', 'Kd', '10c', '5h'))).toBe(4);
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

    it('does not pair two different court cards', () => {
      expect(CribbageHandEval.countPairs(hand('Jh', 'Qs'))).toBe(0);
    });
  });

  describe('countRuns()', () => {
    it('scores 3 for a 3-card run', () => {
      expect(CribbageHandEval.countRuns(hand('3h', '4s', '5d'))).toBe(3);
    });

    it('scores J-Q-K as a run', () => {
      expect(CribbageHandEval.countRuns(hand('Jh', 'Qs', 'Kd'))).toBe(3);
    });

    it('scores a run across the ten and the jack', () => {
      expect(CribbageHandEval.countRuns(hand('9h', '10s', 'Jd'))).toBe(3);
    });

    it('scores only the longest run in a sequence', () => {
      // 2-3-4-5 is a run of four, not 3 + 4 + 3.
      expect(CribbageHandEval.countRuns(hand('2h', '3s', '4d', '5c'))).toBe(4);
    });

    it('scores a run of five', () => {
      expect(CribbageHandEval.countRuns(hand('2h', '3s', '4d', '5c', '6h'))).toBe(5);
    });

    it('scores a double run of three as 6', () => {
      expect(CribbageHandEval.countRuns(hand('3h', '3s', '4d', '5c'))).toBe(6);
    });

    it('scores a triple run as 9', () => {
      expect(CribbageHandEval.countRuns(hand('3h', '3s', '3d', '4c', '5h'))).toBe(9);
    });

    it('scores a double double run as 12', () => {
      expect(CribbageHandEval.countRuns(hand('3h', '3s', '4d', '4c', '5h'))).toBe(12);
    });

    it('does not treat the court cards as one rank', () => {
      expect(CribbageHandEval.countRuns(hand('10h', 'Js', 'Qd', 'Kc'))).toBe(4);
    });

    it('returns 0 for no run', () => {
      expect(CribbageHandEval.countRuns(hand('2h', '3s', '5d', '6c'))).toBe(0);
    });

    it('returns 0 for fewer than three cards', () => {
      expect(CribbageHandEval.countRuns(hand('4h', '5s'))).toBe(0);
    });
  });

  describe('countFlush()', () => {
    it('scores 4 for 4-card flush in hand', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h', '9h', 'Kh'), c('3s'), false)).toBe(4);
    });

    it('scores 5 for 5-card flush', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h', '9h', 'Kh'), c('3h'), false)).toBe(5);
    });

    it('crib requires all 5 cards for flush', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h', '9h', 'Kh'), c('3s'), true)).toBe(0);
    });

    it('scores a five-card flush in the crib', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h', '9h', 'Kh'), c('3h'), true)).toBe(5);
    });

    it('returns 0 for mixed suits', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h', '9h', 'Ks'), c('3h'), false)).toBe(0);
    });

    it('scores a hand flush before the starter is cut', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h', '9h', 'Kh'), null, false)).toBe(4);
    });

    it('returns 0 for a hand shorter than four cards', () => {
      expect(CribbageHandEval.countFlush(hand('2h', '5h'), c('3h'), false)).toBe(0);
    });
  });

  describe('countNobs()', () => {
    it('scores 1 for Jack matching starter suit', () => {
      const h = hand('Jh', '5d', '8c', '2s');
      expect(CribbageHandEval.countNobs(h, c('3h'))).toBe(1);
    });

    it('returns 0 when no nobs', () => {
      const h = hand('Qh', '5d', '8c', '2s');
      expect(CribbageHandEval.countNobs(h, c('3h'))).toBe(0);
    });

    it('returns 0 for a jack of another suit', () => {
      expect(CribbageHandEval.countNobs(hand('Jh', '3s'), c('9s'))).toBe(0);
    });

    it('returns 0 without a starter', () => {
      expect(CribbageHandEval.countNobs(hand('Jh', '3s'), null)).toBe(0);
    });
  });

  describe('scoreHand()', () => {
    it('scores the perfect hand as 29', () => {
      // J of the starter's suit, three fives, the fourth five turned.
      expect(CribbageHandEval.scoreHand(hand('5h', '5s', '5d', 'Jc'), c('5c')).total).toBe(29);
    });

    it('scores four fives and a court card as 28', () => {
      expect(CribbageHandEval.scoreHand(hand('5h', '5s', '5d', '5c'), c('Kc')).total).toBe(28);
    });

    it('scores a hand with nothing as 0', () => {
      expect(CribbageHandEval.scoreHand(hand('2h', '4s', '6d', '8c'), c('Ks')).total).toBe(0);
    });

    it('scores two fifteens and a run of three as 7', () => {
      expect(CribbageHandEval.scoreHand(hand('6h', '7s', '8d', 'Kc'), c('2s')).total).toBe(7);
    });

    it('scores a J-Q-K run the counting value cannot see', () => {
      expect(CribbageHandEval.scoreHand(hand('Jh', 'Qs', 'Kd', '2c'), c('7s')).total).toBe(3);
    });

    it('returns a breakdown that sums to the total', () => {
      const result = CribbageHandEval.scoreHand(hand('5h', '5d', '10h', 'Jh'), c('5c'));
      const { fifteens, pairs, runs, flush, nobs } = result.breakdown;
      expect(fifteens + pairs + runs + flush + nobs).toBe(result.total);
    });
  });

  describe('scorePeggingPlay()', () => {
    it('scores 15 during pegging', () => {
      const result = CribbageHandEval.scorePeggingPlay(c('5h'), hand('Kd'));
      expect(result.points).toBe(2);
      expect(result.description).toContain('Fifteen');
    });

    it('makes fifteen with a king and a five either way round', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('Kh'), hand('5d')).points).toBe(2);
    });

    it('does not make fifteen from a king and a two', () => {
      // The regression an ordinal count would cause: a king worth 13.
      expect(CribbageHandEval.scorePeggingPlay(c('Kh'), hand('2d')).points).toBe(0);
    });

    it('does not make thirty-one from two court cards and an ace', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('Ah'), hand('Kd', 'Qs')).points).toBe(0);
    });

    it('scores pair during pegging', () => {
      const result = CribbageHandEval.scorePeggingPlay(c('7h'), hand('7d'));
      expect(result.points).toBe(2);
      expect(result.description).toContain('Pair');
    });

    it('scores a pair royal', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('7h'), hand('7d', '7s')).points).toBe(6);
    });

    it('scores a double pair royal', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('7h'), hand('7d', '7s', '7c')).points).toBe(12);
    });

    it('does not score a pair broken by another card', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('7h'), hand('7d', '3s')).points).toBe(0);
    });

    it('scores a run of three', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('5h'), hand('3d', '4s')).points).toBe(3);
    });

    it('scores a run laid out of order', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('4h'), hand('5d', '3s')).points).toBe(3);
    });

    it('scores a run of four', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('6h'), hand('3d', '5s', '4c')).points).toBe(4);
    });

    it('scores a court-card run during pegging', () => {
      expect(CribbageHandEval.scorePeggingPlay(c('Qh'), hand('Kd', 'Js')).points).toBe(3);
    });

    it('scores 31', () => {
      const result = CribbageHandEval.scorePeggingPlay(c('Ah'), hand('Kd', 'Ks', 'Kc'));
      expect(result.points).toBe(2);
      expect(result.description).toContain('Thirty-one');
    });

    it('scores thirty-one and a run together', () => {
      // The early return this used to take paid only the 2 for thirty-one.
      const result = CribbageHandEval.scorePeggingPlay(c('8h'), hand('Kd', '6c', '7s'));
      expect(result.points).toBe(5);
      expect(result.description).toContain('Thirty-one');
      expect(result.description).toContain('Run of 3');
    });

    it('scores nothing when nothing scores', () => {
      const result = CribbageHandEval.scorePeggingPlay(c('9h'), hand('2d'));
      expect(result.points).toBe(0);
      expect(result.description).toBe('');
    });
  });
});
