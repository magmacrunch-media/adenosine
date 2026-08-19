# API Reference — adenosine-cards

Card deck, pixel-art SVG rendering, poker chip animations, and hand evaluators.

## Table of Contents

- [Card](#card) — Single card
- [Deck](#deck) — Shuffled 52-card deck
- [Hand Evaluators](#hand-evaluators) — Poker and cribbage scoring
- [Chip Animation](#chip-animation) — Canvas poker chip rendering
- [Constants](#constants) — Suits, ranks, colours
- [CSS Variables](#css-variables) — Theming

---

## Card

### `new Card(suit, rank)`

| Param | Type | Description |
|-------|------|-------------|
| `suit` | `Suit` | One of `'hearts'`, `'diamonds'`, `'clubs'`, `'spades'` |
| `rank` | `Rank` | `'A'`, `'2'`–`'10'`, `'J'`, `'Q'`, `'K'` |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `.suit` | `Suit` | The card's suit |
| `.rank` | `Rank` | The card's rank |
| `.color` | `string` | Hex colour (`'#cc0000'` or `'#111111'`) |
| `.colorName` | `CardColorName` | `'red'` or `'black'` — use for CSS classes |
| `.value` | `number` | Numeric value from `RANK_VALUES` |

### `.getHTML(faceUp?)`

Returns an HTML string for the card. Face-down shows the back design.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `faceUp` | `boolean` | `true` | Show face or back |

### `.getID()`

Returns a unique string like `'hearts-A'` or `'spades-K'`.

---

## Deck

### `new Deck()`

Creates a standard 52-card deck.

### `.shuffle()`

Fisher-Yates shuffle. Modifies the deck in place.

### `.draw(count?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | `number` | `1` | Number of cards to draw |

Returns `Card[]`. Removes drawn cards from the deck.

### `.reset()`

Restore the deck to a full 52 cards (unshuffled).

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `.cards` | `Card[]` | Remaining cards |
| `.length` | `number` | Cards remaining |

---

## Hand Evaluators

### Poker: `new HandEvaluator()`

#### `.evaluate(cards)`

Evaluate the best 5-card hand from 2–7 cards.

| Param | Type | Description |
|-------|------|-------------|
| `cards` | `EvalCard[]` | Cards to evaluate (each needs `suit`, `rank`, `value`) |

Returns `HandResult`:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Hand name (e.g. `'Full House'`, `'Flush'`) |
| `rank` | `number` | Numeric rank (0=High Card, 9=Royal Flush) |
| `points` | `number` | Point value for scoring |
| `tiebreakers` | `number[]` | For comparing equal-ranked hands |
| `cards` | `EvalCard[]` | The 5 cards that form the hand |
| `description` | `string` | Human-readable description |
| `partial` | `boolean` | `true` if fewer than 5 cards |

**Note:** `evaluate()` reads `value` off the cards it is handed and never rewrites
it — that is how one evaluator serves both ace-low and ace-high games. `Card`
stamps the ace-low `RANK_VALUES` (A=1), which is what cribbage and solitaire
want, so **dealing straight from a `Deck` into a poker `evaluate()` is a bug**:
aces sort below twos, a royal flush grades as an ordinary flush, and A-K-Q-J-10
is not seen as a straight at all.

Poker callers must restamp:

```js
import { POKER_RANK_VALUES } from '@magmacrunch/adenosine-cards';

const card = deck.deal();
card.value = POKER_RANK_VALUES[card.rank];   // A=14
```

Do this at the single point where cards enter play, not per hand — this bug has
recurred twice by being remembered at some deal sites and not others.

### Cribbage: `new CribbageHandEval()`

#### `.score(hand, start?)`

Score a cribbage hand.

| Param | Type | Description |
|-------|------|-------------|
| `hand` | `CribCard[]` | 4 cards in hand |
| `start` | `CribCard` | The starter card (cut card) |

Returns `CribScore`:

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total points |
| `breakdown` | `CribBreakdown` | Points per category: `{ fifteens, pairs, runs, flush, nobs }` |

---

## Chip Animation

### `drawChip(ctx, denom, cx, topY)`

Draw a single chip sprite onto a canvas context.

### `renderStack(ctx, denom, count, cx, topY)`

Draw a stack of like-valued chips. Returns the Y coordinate below the stack.

### `breakIntoStacks(amount)`

Break a chip amount into an array of `ChipStack` objects.

### `DENOMS`

Array of 5 chip denominations: 500 (purple), 100 (black), 25 (green), 5 (red), 1 (white).

---

## Constants

| Export | Type | Description |
|--------|------|-------------|
| `SUITS` | `['hearts', 'diamonds', 'clubs', 'spades']` | All suits |
| `RANKS` | `['A', '2', ..., 'K']` | All ranks |
| `SUIT_SYMBOLS` | `Record<Suit, string>` | `♥`, `♦`, `♣`, `♠` |
| `SUIT_COLORS` | `Record<Suit, string>` | Hex colours per suit |
| `SUIT_COLOR_NAMES` | `Record<Suit, 'red' \| 'black'>` | Colour names for CSS classes |
| `RANK_VALUES` | `Record<Rank, number>` | Ace-low values (A=1, J=11, Q=12, K=13). What `Card` stamps |
| `POKER_RANK_VALUES` | `Record<Rank, number>` | Ace-high values (A=14). For poker — see the note under `.evaluate()` |
| `pokerValue` | `(rank: Rank) => number` | The ace-high value of a single rank |

---

## CSS Variables

The `cards.css` stylesheet uses CSS custom properties for theming:

| Variable | Default | Description |
|----------|---------|-------------|
| `--fc-red` | `#cc0000` | Red suit colour |
| `--fc-black` | `#111111` | Black suit colour |

Fallbacks are built in — cards render correctly even without defining these variables.
