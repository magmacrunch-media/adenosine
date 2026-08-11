/**
 * Cribbage hand evaluator.
 * Scores hands and crib using standard cribbage rules.
 * From MagmaCrunch Media.
 */

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
};

// Cribbage uses Ace=11 for face cards in some contexts, but for hand scoring
// we use the standard RANK_VALUES where J=11, Q=12, K=13, Ace=1.
// The rank value for 15-counting is: number cards face value, J/Q/K = 10, Ace = 1.

function cribbageValue(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank);
}

const CribbageHandEval = {

  countFifteens(cards) {
    let count = 0;
    const n = cards.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          sum += cribbageValue(cards[i].rank);
        }
      }
      if (sum === 15) count++;
    }
    return count;
  },

  countPairs(cards) {
    const rankCounts = {};
    for (const card of cards) {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }
    let points = 0;
    for (const rank in rankCounts) {
      const count = rankCounts[rank];
      if (count === 2) points += CRIBBAGE_SCORE.PAIR;
      else if (count === 3) points += CRIBBAGE_SCORE.THREE_OF_KIND;
      else if (count === 4) points += CRIBBAGE_SCORE.FOUR_OF_KIND;
    }
    return points;
  },

  countRuns(cards) {
    if (cards.length < 3) return 0;

    const valueCounts = {};
    for (const card of cards) {
      const val = cribbageValue(card.rank);
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    }

    const uniqueValues = Object.keys(valueCounts).map(Number).sort((a, b) => a - b);

    let totalPoints = 0;
    let i = 0;

    while (i < uniqueValues.length) {
      let j = i;
      while (j + 1 < uniqueValues.length && uniqueValues[j + 1] === uniqueValues[j] + 1) {
        j++;
      }

      const seqLength = j - i + 1;

      if (seqLength >= 3) {
        for (let start = i; start <= j - 2; start++) {
          for (let end = start + 2; end <= j; end++) {
            const runLength = end - start + 1;
            let multiplier = 1;
            for (let k = start; k <= end; k++) {
              multiplier *= valueCounts[uniqueValues[k]];
            }
            totalPoints += runLength * multiplier;
          }
        }
      }

      i = j + 1;
    }

    return totalPoints;
  },

  countFlush(hand, starter, isCrib) {
    if (!starter) return 0;
    const handSuit = hand[0].suit;
    const isHandFlush = hand.every(c => c.suit === handSuit);
    if (!isHandFlush) return 0;
    if (starter.suit === handSuit) return CRIBBAGE_SCORE.FLUSH_5;
    if (isCrib) return 0;
    return CRIBBAGE_SCORE.FLUSH_4;
  },

  countNobs(hand, starter) {
    if (!starter) return 0;
    for (const card of hand) {
      if (card.rank === 'J' && card.suit === starter.suit) {
        return CRIBBAGE_SCORE.NIBS;
      }
    }
    return 0;
  },

  scoreHand(hand, starter, isCrib = false) {
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

  scorePeggingPlay(card, playedCards) {
    const count = playedCards.reduce((sum, c) => sum + cribbageValue(c.rank), 0) + cribbageValue(card.rank);
    let points = 0;
    const descriptions = [];

    if (count === 31) {
      points += CRIBBAGE_SCORE.THIRTY_ONE;
      descriptions.push('Thirty-one!');
      return { points, description: descriptions.join(' + ') };
    }

    if (count === 15) {
      points += CRIBBAGE_SCORE.FIFTEEN;
      descriptions.push('Fifteen!');
    }

    if (playedCards.length >= 1) {
      const lastCard = playedCards[playedCards.length - 1];
      if (card.rank === lastCard.rank) {
        if (playedCards.length >= 3 && playedCards[playedCards.length - 2].rank === card.rank &&
            playedCards[playedCards.length - 3].rank === card.rank) {
          points += CRIBBAGE_SCORE.FOUR_OF_KIND;
          descriptions.push('Four of a kind!');
        } else if (playedCards.length >= 2 && playedCards[playedCards.length - 2].rank === card.rank) {
          points += CRIBBAGE_SCORE.THREE_OF_KIND;
          descriptions.push('Three of a kind!');
        } else {
          points += CRIBBAGE_SCORE.PAIR;
          descriptions.push('Pair!');
        }
      }
    }

    if (playedCards.length >= 2) {
      const allPlayed = [...playedCards, card];
      let runLength = 0;
      for (let len = Math.min(allPlayed.length, 7); len >= 3; len--) {
        const lastN = allPlayed.slice(-len);
        const values = lastN.map(c => cribbageValue(c.rank)).sort((a, b) => a - b);
        let isRun = true;
        for (let i = 1; i < values.length; i++) {
          if (values[i] !== values[i - 1] + 1) {
            isRun = false;
            break;
          }
        }
        if (isRun) {
          runLength = len;
          break;
        }
      }
      if (runLength >= 3) {
        points += runLength;
        descriptions.push(`Run of ${runLength}!`);
      }
    }

    return { points, description: descriptions.join(' + ') || '' };
  },
};

export { CribbageHandEval, CRIBBAGE_SCORE };
