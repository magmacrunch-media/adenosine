/**
 * Poker hand evaluator.
 * Evaluates the best 5-card hand from 2-7 cards.
 * From Texas Hold'Em Lava Dome.
 */


/**
 * A card as the evaluator needs it. `value` is supplied by the caller and is
 * never rewritten here, which is how the same evaluator serves ace-low and
 * ace-high games.
 *
 * Poker is ace-high, so a poker caller must stamp `value` from
 * `POKER_RANK_VALUES` (A=14). `Deck` stamps the ace-low `RANK_VALUES` (A=1) on
 * the cards it builds, so dealing straight from a `Deck` into `evaluate()` is a
 * bug: aces sort below twos, and a royal flush grades as an ordinary flush.
 */
export interface EvalCard {
  suit: string;
  rank: string;
  value: number;
  [key: string]: unknown;
}

/** The outcome of evaluating a hand. */
export interface HandResult {
  name: HandName | 'No Cards';
  rank: number;
  points: number;
  tiebreakers: number[];
  cards: EvalCard[];
  description: string;
  partial?: boolean;
}

const HAND_RANKS = {
  'Royal Flush':     9,
  'Straight Flush':  8,
  'Four of a Kind':  7,
  'Full House':      6,
  'Flush':           5,
  'Straight':        4,
  'Three of a Kind': 3,
  'Two Pair':        2,
  'One Pair':        1,
  'High Card':       0,
} as const;

/** The name of a poker hand, as used by both lookup tables. */
export type HandName = keyof typeof HAND_RANKS;

const HAND_POINTS = {
  'Royal Flush':     1000,
  'Straight Flush':  500,
  'Four of a Kind':  250,
  'Full House':      150,
  'Flush':           100,
  'Straight':        75,
  'Three of a Kind': 50,
  'Two Pair':        25,
  'One Pair':        10,
  'High Card':       0,
} as const;

class HandEvaluator {

  evaluate(cards: EvalCard[]): HandResult {
    if (!cards || cards.length < 2) {
      return this._emptyResult();
    }
    if (cards.length < 5) {
      return this._evaluatePartial(cards);
    }
    const combos = this._combinations(cards, 5);
    let best = null;
    for (const combo of combos) {
      const result = this._evaluateFive(combo);
      if (!best || this._compareTo(result, best) > 0) {
        best = result;
      }
    }
    return best ?? this._emptyResult();
  }

  _evaluateFive(cards: EvalCard[]): HandResult {
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const isFlush = this._isFlush(cards);
    const isStraight = this._isStraight(sorted);
    const counts = this._getValueCounts(cards);
    const countVals = Object.values(counts).sort((a, b) => b - a);

    let name: HandName;
    let rank: number;
    let tiebreakers: number[];

    if (isFlush && isStraight && sorted[0]!.value === 14 && sorted[1]!.value === 13) {
      name = 'Royal Flush';
      rank = HAND_RANKS['Royal Flush'];
      tiebreakers = [14];
    } else if (isFlush && isStraight) {
      name = 'Straight Flush';
      rank = HAND_RANKS['Straight Flush'];
      tiebreakers = [this._straightHighCard(sorted)];
    } else if ((countVals[0] ?? 0) === 4) {
      name = 'Four of a Kind';
      rank = HAND_RANKS['Four of a Kind'];
      tiebreakers = this._tiebreakByCount(counts, [4, 1]);
    } else if ((countVals[0] ?? 0) === 3 && (countVals[1] ?? 0) === 2) {
      name = 'Full House';
      rank = HAND_RANKS['Full House'];
      tiebreakers = this._tiebreakByCount(counts, [3, 2]);
    } else if (isFlush) {
      name = 'Flush';
      rank = HAND_RANKS['Flush'];
      tiebreakers = sorted.map(c => c.value);
    } else if (isStraight) {
      name = 'Straight';
      rank = HAND_RANKS['Straight'];
      tiebreakers = [this._straightHighCard(sorted)];
    } else if ((countVals[0] ?? 0) === 3) {
      name = 'Three of a Kind';
      rank = HAND_RANKS['Three of a Kind'];
      tiebreakers = this._tiebreakByCount(counts, [3, 1, 1]);
    } else if ((countVals[0] ?? 0) === 2 && (countVals[1] ?? 0) === 2) {
      name = 'Two Pair';
      rank = HAND_RANKS['Two Pair'];
      tiebreakers = this._tiebreakByCount(counts, [2, 2, 1]);
    } else if ((countVals[0] ?? 0) === 2) {
      name = 'One Pair';
      rank = HAND_RANKS['One Pair'];
      tiebreakers = this._tiebreakByCount(counts, [2, 1, 1, 1]);
    } else {
      name = 'High Card';
      rank = HAND_RANKS['High Card'];
      tiebreakers = sorted.map(c => c.value);
    }

    return {
      name,
      rank,
      points: HAND_POINTS[name],
      tiebreakers,
      cards: sorted,
      description: this._describe(name, sorted),
    };
  }

  _evaluatePartial(cards: EvalCard[]): HandResult {
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const counts = this._getValueCounts(cards);
    const countVals = Object.values(counts).sort((a, b) => b - a);

    let name: HandName = 'High Card';
    if ((countVals[0] ?? 0) === 2 && (countVals[1] ?? 0) === 2) name = 'Two Pair';
    else if ((countVals[0] ?? 0) === 3 && (countVals[1] ?? 0) === 2) name = 'Full House';
    else if ((countVals[0] ?? 0) === 4) name = 'Four of a Kind';
    else if ((countVals[0] ?? 0) === 3) name = 'Three of a Kind';
    else if ((countVals[0] ?? 0) === 2) name = 'One Pair';

    return {
      name,
      rank: HAND_RANKS[name],
      points: HAND_POINTS[name],
      tiebreakers: sorted.map(c => c.value),
      cards: sorted,
      description: `${name} (partial)`,
      partial: true,
    };
  }

  _emptyResult(): HandResult {
    return {
      name: 'No Cards',
      rank: -1,
      points: 0,
      tiebreakers: [],
      cards: [],
      description: 'No cards dealt',
      partial: true,
    };
  }

  _compareTo(a: HandResult, b: HandResult): number {
    if (a.rank !== b.rank) return a.rank - b.rank;
    for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
      const av = a.tiebreakers[i] || 0;
      const bv = b.tiebreakers[i] || 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  }

  _isFlush(cards: EvalCard[]): boolean {
    const suit = cards[0]!.suit;
    return cards.every(c => c.suit === suit);
  }

  _isStraight(sortedCards: EvalCard[]): boolean {
    let straight = true;
    for (let i = 0; i < sortedCards.length - 1; i++) {
      if (sortedCards[i]!.value - sortedCards[i + 1]!.value !== 1) {
        straight = false;
        break;
      }
    }
    if (straight) return true;

    const values = sortedCards.map(c => c.value).sort((a, b) => a - b);
    if (values[4] === 14 && values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5) {
      return true;
    }
    return false;
  }

  _straightHighCard(sortedCards: EvalCard[]): number {
    const values = sortedCards.map(c => c.value).sort((a, b) => a - b);
    if (values[4] === 14 && values[0] === 2 && values[3] === 5) return 5;
    return sortedCards[0]!.value;
  }

  /**
   * The rank to label a straight with. Mirrors `_straightHighCard`: in the
   * wheel (A-2-3-4-5) the ace plays low, so the hand is five high even though
   * the ace sorts to the front.
   */
  _straightRankName(sortedCards: EvalCard[]): string {
    const high = this._straightHighCard(sortedCards);
    return sortedCards.find(c => c.value === high)?.rank ?? sortedCards[0]!.rank;
  }

  _getValueCounts(cards: EvalCard[]): Record<number, number> {
    const counts: Record<string, number> = {};
    cards.forEach(c => {
      counts[c.value] = (counts[c.value] || 0) + 1;
    });
    return counts;
  }

  _tiebreakByCount(counts: Record<number, number>, pattern: number[]): number[] {
    const groups: Record<number, number[]> = {};
    Object.entries(counts).forEach(([val, cnt]) => {
      const c = Number(cnt);
      (groups[c] ??= []).push(parseInt(val, 10));
    });
    Object.values(groups).forEach((g) => g.sort((a, b) => b - a));

    const result: number[] = [];
    const seen = new Set<number>();
    for (const targetCount of pattern) {
      if (groups[targetCount]) {
        for (const val of groups[targetCount]) {
          if (!seen.has(val)) {
            result.push(val);
            seen.add(val);
            break;
          }
        }
      }
    }
    return result;
  }

  _combinations(arr: EvalCard[], k: number): EvalCard[][] {
    const results: EvalCard[][] = [];
    function combine(start: number, current: EvalCard[]): void {
      if (current.length === k) {
        results.push([...current]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]!);
        combine(i + 1, current);
        current.pop();
      }
    }
    combine(0, []);
    return results;
  }

  _describe(name: string, sortedCards: EvalCard[]): string {
    const top = sortedCards[0]!;
    switch (name) {
      case 'Royal Flush':
        return `Royal Flush — ${top!.suit}`;
      case 'Straight Flush':
        return `Straight Flush — ${this._straightRankName(sortedCards)} high`;
      case 'Four of a Kind':
        return `Four ${top!.rank}s`;
      case 'Full House': {
        const counts = this._getValueCounts(sortedCards);
        const triple = Object.entries(counts).find(([, v]) => v === 3);
        const pair = Object.entries(counts).find(([, v]) => v === 2);
        const rankName = (r: string): string =>
          sortedCards.find((c) => c.value === parseInt(r, 10))?.rank ?? r;
        return triple && pair
          ? `Full House — ${rankName(triple[0])}s full of ${rankName(pair[0])}s`
          : 'Full House';
      }
      case 'Flush':
        return `Flush — ${top!.rank} high (${top!.suit})`;
      case 'Straight':
        return `Straight — ${this._straightRankName(sortedCards)} high`;
      case 'Three of a Kind':
        return `Three ${top!.rank}s`;
      case 'Two Pair': {
        const counts = this._getValueCounts(sortedCards);
        const pairs = Object.entries(counts)
          .filter(([, v]) => v === 2)
          .map(([k]) => sortedCards.find((c) => c.value === parseInt(k, 10))?.rank ?? k)
          .join('s and ');
        return `Two Pair — ${pairs}s`;
      }
      case 'One Pair': {
        const counts = this._getValueCounts(sortedCards);
        const pair = Object.entries(counts).find(([, v]) => v === 2);
        const pairRank = pair
          ? (sortedCards.find((c) => c.value === parseInt(pair[0], 10))?.rank ?? pair[0])
          : '';
        return `Pair of ${pairRank}s`;
      }
      case 'High Card':
        return `${top!.rank} high`;
      default:
        return name;
    }
  }
}

export { HandEvaluator, HAND_RANKS, HAND_POINTS };
