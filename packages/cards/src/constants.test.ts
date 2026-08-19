import { describe, it, expect } from 'vitest';
import { SUITS, RANKS, SUIT_SYMBOLS, SUIT_COLORS, RANK_VALUES, POKER_RANK_VALUES, pokerValue } from './constants.js';

describe('Card Constants', () => {
  describe('SUITS', () => {
    it('has 4 suits', () => {
      expect(SUITS).toHaveLength(4);
    });

    it('contains standard suits', () => {
      expect(SUITS).toEqual(['hearts', 'diamonds', 'clubs', 'spades']);
    });
  });

  describe('RANKS', () => {
    it('has 13 ranks', () => {
      expect(RANKS).toHaveLength(13);
    });

    it('starts with Ace and ends with King', () => {
      expect(RANKS[0]).toBe('A');
      expect(RANKS[12]).toBe('K');
    });
  });

  describe('SUIT_SYMBOLS', () => {
    it('maps each suit to its symbol', () => {
      expect(SUIT_SYMBOLS.hearts).toBe('♥');
      expect(SUIT_SYMBOLS.diamonds).toBe('♦');
      expect(SUIT_SYMBOLS.clubs).toBe('♣');
      expect(SUIT_SYMBOLS.spades).toBe('♠');
    });
  });

  describe('SUIT_COLORS', () => {
    it('hearts and diamonds are red', () => {
      expect(SUIT_COLORS.hearts).toBe('#cc0000');
      expect(SUIT_COLORS.diamonds).toBe('#cc0000');
    });

    it('clubs and spades are black', () => {
      expect(SUIT_COLORS.clubs).toBe('#111111');
      expect(SUIT_COLORS.spades).toBe('#111111');
    });
  });

  describe('RANK_VALUES', () => {
    it('Ace is 1', () => {
      expect(RANK_VALUES.A).toBe(1);
    });

    it('number cards match face value', () => {
      expect(RANK_VALUES['2']).toBe(2);
      expect(RANK_VALUES['10']).toBe(10);
    });

    it('face cards are 11-13', () => {
      expect(RANK_VALUES.J).toBe(11);
      expect(RANK_VALUES.Q).toBe(12);
      expect(RANK_VALUES.K).toBe(13);
    });
  });

  describe('POKER_RANK_VALUES', () => {
    it('Ace is 14', () => {
      expect(POKER_RANK_VALUES.A).toBe(14);
    });

    it('matches RANK_VALUES for every rank except the ace', () => {
      for (const rank of RANKS) {
        if (rank === 'A') continue;
        expect(POKER_RANK_VALUES[rank]).toBe(RANK_VALUES[rank]);
      }
    });

    it('leaves RANK_VALUES ace-low — cribbage and solitaire depend on it', () => {
      expect(RANK_VALUES.A).toBe(1);
    });

    it('pokerValue() reads from the ace-high table', () => {
      expect(pokerValue('A')).toBe(14);
      expect(pokerValue('K')).toBe(13);
      expect(pokerValue('2')).toBe(2);
    });
  });
});
