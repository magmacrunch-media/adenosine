/**
 * Default card game constants.
 * These are the standard values used across most card games.
 * Games with different conventions (e.g., Ace-high) should define their own.
 */

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

/** One of the four standard suits. */
export type Suit = (typeof SUITS)[number];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

/** A card rank, ace low through king. */
export type Rank = (typeof RANKS)[number];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#cc0000',
  diamonds: '#cc0000',
  clubs: '#111111',
  spades: '#111111',
};

export const RANK_VALUES: Record<Rank, number> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
};
