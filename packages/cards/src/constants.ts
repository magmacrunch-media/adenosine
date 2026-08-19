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

/**
 * Ace-low rank values — the default, and what `Card` stamps on every card
 * it builds. Cribbage counts an ace as 1 for fifteens, and solitaire builds its
 * foundations from the ace up, so this stays ace-low.
 *
 * Poker is the exception: use {@link POKER_RANK_VALUES} there instead.
 */
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

/**
 * Ace-high rank values, for poker. Identical to {@link RANK_VALUES} except that
 * an ace is 14, so it outranks a king rather than falling below a two.
 *
 * `HandEvaluator` reads `value` straight off the cards it is handed and never
 * rewrites it, so a poker game dealing from `Deck` must restamp its cards
 * from this table — otherwise aces score as the lowest card in the deck and a
 * royal flush is graded as an ordinary flush.
 */
export const POKER_RANK_VALUES: Record<Rank, number> = {
  ...RANK_VALUES,
  A: 14,
};

/** The ace-high value of a rank. See {@link POKER_RANK_VALUES}. */
export function pokerValue(rank: Rank): number {
  return POKER_RANK_VALUES[rank];
}
