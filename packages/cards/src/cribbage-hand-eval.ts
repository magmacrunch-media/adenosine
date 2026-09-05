/**
 * Cribbage hand evaluator.
 * Scores hands and crib using standard cribbage rules.
 * From MagmaCrunch Media.
 */


/** A card as cribbage scoring needs it. */
export interface CribCard {
  suit: string;
  rank: string;
  [key: string]: unknown;
}

/** Points contributed by each scoring category in a cribbage hand. */
export interface CribBreakdown {
  fifteens: number;
  pairs: number;
  runs: number;
  flush: number;
  nobs: number;
}

/** A scored cribbage hand. */
export interface CribScore {
  total: number;
  breakdown: CribBreakdown;
}

/** The result of one pegging play. */
export interface PeggingResult {
  points: number;
  description: string;
}

const CRIBBAGE_SCORE = {
  FIFTEEN:       2,
  PAIR:          2,
  THREE_OF_KIND: 6,
  FOUR_OF_KIND: 12,
  FLUSH_4:       4,
  FLUSH_5:       5,
  NIBS:          1,
  HIS_HEELS:     2,
  GO:            1,
  THIRTY_ONE:    2,
} as const;

/**
 * Where a card sits in a run: A=1 through K=13, with the three court cards
 * distinct from each other and from the ten.
 *
 * A card has two numbers in cribbage and only one of them collapses the court.
 * Building runs out of the counting value instead is a real bug with two
 * visible faces -- J-Q-K reads as three tens and scores nothing, and 9-10-J
 * is not consecutive because the jack has become a second ten. Fifteens and
 * thirty-one are the only places the court is worth ten.
 */
const CRIBBAGE_ORDER: Record<string, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13,
};

/** Where a card sits in a run. 0 for a rank this table does not name. */
function cribbageOrder(rank: string): number {
  return CRIBBAGE_ORDER[rank] ?? 0;
}

/** What a card is worth toward fifteen and thirty-one: every court card ten. */
function cribbageValue(rank: string): number {
  return Math.min(cribbageOrder(rank), 10);
}

const CribbageHandEval = {

  /** What a card counts toward fifteen and thirty-one -- J, Q and K are 10. */
  value(rank: string): number {
    return cribbageValue(rank);
  },

  /** Where a card sits in a run -- A=1 through K=13, court cards distinct. */
  order(rank: string): number {
    return cribbageOrder(rank);
  },

  countFifteens(cards: CribCard[]): number {
    let count = 0;
    const n = cards.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          sum += cribbageValue(cards[i]!.rank);
        }
      }
      if (sum === 15) count++;
    }
    return count;
  },

  countPairs(cards: CribCard[]): number {
    const rankCounts: Record<string, number> = {};
    for (const card of cards) {
      rankCounts[card.rank] = (rankCounts[card.rank] ?? 0) + 1;
    }
    let points = 0;
    for (const rank in rankCounts) {
      const count = rankCounts[rank] ?? 0;
      if (count === 2) points += CRIBBAGE_SCORE.PAIR;
      else if (count === 3) points += CRIBBAGE_SCORE.THREE_OF_KIND;
      else if (count === 4) points += CRIBBAGE_SCORE.FOUR_OF_KIND;
    }
    return points;
  },

  /**
   * Only the longest run in each consecutive block scores, once for every way
   * duplicate ranks can build it -- so 2-3-4-5 is 4, not the 3 + 4 + 3 that
   * paying each sub-run would give, and a double run of three is 6 (plus 2 for
   * its pair, counted by `countPairs`).
   */
  countRuns(cards: CribCard[]): number {
    if (cards.length < 3) return 0;

    const orderCounts: Record<number, number> = {};
    for (const card of cards) {
      const ord = cribbageOrder(card.rank);
      orderCounts[ord] = (orderCounts[ord] || 0) + 1;
    }

    const uniqueOrders = Object.keys(orderCounts).map(Number).sort((a, b) => a - b);

    let totalPoints = 0;
    let i = 0;

    while (i < uniqueOrders.length) {
      let j = i;
      while (j + 1 < uniqueOrders.length && uniqueOrders[j + 1] === uniqueOrders[j]! + 1) {
        j++;
      }

      const seqLength = j - i + 1;

      if (seqLength >= 3) {
        let ways = 1;
        for (let k = i; k <= j; k++) {
          ways *= orderCounts[uniqueOrders[k]!] ?? 1;
        }
        totalPoints += seqLength * ways;
      }

      i = j + 1;
    }

    return totalPoints;
  },

  /** The starter never makes a four-card flush, and a crib flush must be five. */
  countFlush(hand: CribCard[], starter: CribCard | null, isCrib: boolean): number {
    if (hand.length < 4) return 0;
    const handSuit = hand[0]?.suit;
    if (!hand.every(c => c.suit === handSuit)) return 0;
    if (starter && starter.suit === handSuit) return CRIBBAGE_SCORE.FLUSH_5;
    return isCrib ? 0 : CRIBBAGE_SCORE.FLUSH_4;
  },

  countNobs(hand: CribCard[], starter: CribCard | null): number {
    if (!starter) return 0;
    for (const card of hand) {
      if (card.rank === 'J' && card.suit === starter.suit) {
        return CRIBBAGE_SCORE.NIBS;
      }
    }
    return 0;
  },

  scoreHand(hand: CribCard[], starter: CribCard | null, isCrib = false): CribScore {
    const allCards = starter ? [...hand, starter] : [...hand];
    const fifteens = this.countFifteens(allCards) * CRIBBAGE_SCORE.FIFTEEN;
    const pairs = this.countPairs(allCards);
    const runs = this.countRuns(allCards);
    const flush = this.countFlush(hand, starter, isCrib);
    const nobs = this.countNobs(hand, starter);
    return {
      total: fifteens + pairs + runs + flush + nobs,
      breakdown: { fifteens, pairs, runs, flush, nobs },
    };
  },

  /**
   * Score laying `card` on top of `playedCards`, the series so far this go.
   *
   * Every category is counted: a card that makes thirty-one and completes a
   * run scores both.
   */
  scorePeggingPlay(card: CribCard, playedCards: CribCard[]): PeggingResult {
    const sequence = [...playedCards, card];
    const count = sequence.reduce((sum, c) => sum + cribbageValue(c.rank), 0);

    let points = 0;
    const descriptions: string[] = [];

    if (count === 15) {
      points += CRIBBAGE_SCORE.FIFTEEN;
      descriptions.push('Fifteen!');
    }
    if (count === 31) {
      points += CRIBBAGE_SCORE.THIRTY_ONE;
      descriptions.push('Thirty-one!');
    }

    // Pairs count back from the card just laid, so a pair royal only scores
    // while the equal ranks are unbroken.
    let matching = 1;
    for (let i = playedCards.length - 1; i >= 0 && playedCards[i]!.rank === card.rank; i--) {
      matching++;
    }
    if (matching === 2) {
      points += CRIBBAGE_SCORE.PAIR;
      descriptions.push('Pair!');
    } else if (matching === 3) {
      points += CRIBBAGE_SCORE.THREE_OF_KIND;
      descriptions.push('Pair royal!');
    } else if (matching >= 4) {
      points += CRIBBAGE_SCORE.FOUR_OF_KIND;
      descriptions.push('Double pair royal!');
    }

    // The longest tail of the series that forms a run, played in any order.
    for (let length = sequence.length; length >= 3; length--) {
      const tail = sequence.slice(-length)
        .map(c => cribbageOrder(c.rank))
        .sort((a, b) => a - b);
      const consecutive = tail.every((ord, i) => i === 0 || ord === tail[i - 1]! + 1);
      if (consecutive) {
        points += length;
        descriptions.push(`Run of ${length}!`);
        break;
      }
    }

    return { points, description: descriptions.join(' + ') };
  },
};

export { CribbageHandEval, CRIBBAGE_SCORE };
