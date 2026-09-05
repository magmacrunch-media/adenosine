# API Reference — adenosine-cards

Card deck, pixel-art SVG rendering, poker chip animations, and hand evaluators.

## Table of Contents

- [Card](#card) — Single card
- [Deck](#deck) — Shuffled 52-card deck
- [Hand Evaluators](#hand-evaluators) — Poker and cribbage scoring
- [Card Art](#card-art) — Pip layout, corners, face card SVG
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

### `.flip()`

Toggle `faceUp`.

There is no ID accessor; a card identifies itself through its `suit` and `rank`,
and the rendered element carries them as `data-suit` / `data-rank`.

---

## Deck

### `new Deck()`

Creates a standard 52-card deck.

### `.shuffle()`

Fisher-Yates shuffle. Modifies the deck in place.

### `.deal()`

Take one card off the top. Returns a `Card`, or `undefined` once the deck is
empty. Removes it from `.cards`.

```js
const card = deck.deal();
card.faceUp = true;
```

### `.createDeck()`

Rebuild a full, unshuffled 52 cards in place. The constructor calls it, so this
is only needed to reuse an existing `Deck` for a new hand.

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

### Cribbage: `CribbageHandEval`

**A plain object, not a class — there is no `new CribbageHandEval()`.** Call its
methods directly off the export.

#### `CribbageHandEval.scoreHand(hand, starter, isCrib?)`

Score a cribbage hand.

| Param | Type | Description |
|-------|------|-------------|
| `hand` | `CribCard[]` | 4 cards in hand |
| `starter` | `CribCard \| null` | The starter card (cut card); pass `null` for none |
| `isCrib` | `boolean` | Whether this hand is the crib — a crib flush needs all five suits to match. Default `false`. |

Returns `CribScore`:

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total points |
| `breakdown` | `CribBreakdown` | Points per category: `{ fifteens, pairs, runs, flush, nobs }` |

#### Other `CribbageHandEval` methods

| Method | Description |
|--------|-------------|
| `.value(rank)` | What the rank counts toward fifteen and thirty-one -- J, Q and K are all 10 |
| `.order(rank)` | Where the rank sits in a run -- A=1 through K=13, the court cards distinct |
| `.countFifteens(cards)` | Combinations summing to 15 -- a count, not points |
| `.countPairs(cards)` | Pairs, counting three- and four-of-a-kind as their pair count |
| `.countRuns(cards)` | Points for the longest run in each consecutive block, multiplied by the ways duplicate ranks build it |
| `.countFlush(hand, starter, isCrib)` | 4 for a flush in hand, 5 including the starter |
| `.countNobs(hand, starter)` | 1 for the jack matching the starter's suit |
| `.scorePeggingPlay(card, playedCards)` | Points for one card during the play, every category counted |

A card carries two numbers and only one of them flattens the court. `.value()`
is for fifteens and thirty-one; `.order()` is what runs are built from, in the
hand and during the play alike. Scoring J-Q-K or 9-10-J off `.value()` finds no
run at all.

Runs pay the longest sequence only, so 2-3-4-5 is 4 -- not the 3 + 4 + 3 that
paying each sub-run gives. Duplicate ranks multiply it: a double run of three is
6 (its pair is `.countPairs()`'s 2), a triple run 9, a double double run 12.

`CRIBBAGE_SCORE` exports the point values these use — `FIFTEEN`, `PAIR`,
`THREE_OF_KIND`, `FOUR_OF_KIND`, `FLUSH_4`, `FLUSH_5`, `NIBS`, `HIS_HEELS`, `GO`,
`THIRTY_ONE`.

### Poker lookup tables

| Export | Description |
|--------|-------------|
| `HAND_RANKS` | Hand name → comparison rank, `'High Card'` 0 through `'Royal Flush'` 9 |
| `HAND_POINTS` | Hand name → score value, `'High Card'` through `'Royal Flush'` 1000 |

Both are keyed by the same `HandName` strings `HandEvaluator.evaluate()` returns.

---

## Card Art

The HTML/SVG a `Card` renders is assembled from these, all exported so a game can
build its own card faces without going through `Card.getHTML()`.

### Number and ace faces

| Export | Description |
|--------|-------------|
| `pipColor(suit)` | The CSS colour for a suit's ink — the `--fc-red` / `--fc-black` custom properties, with literal fallbacks |
| `cornerPipSVG(suit, color)` | One corner pip glyph as SVG markup |
| `cornerHTML(rank, suit, color?)` | Both corner indices (rank letter plus suit glyph) as markup |
| `getSuitLayout(rank, suit, color?)` | The centre pip arrangement for a number card |
| `getNumberCardHTML(suit, rank)` | A complete 2–10 face |
| `getAceHTML(suit, rank)` | A complete ace face, with the oversized centre pip |

Omitting `color` emits no inline `style` at all, leaving the colour to the
stylesheet — which is what `Card.getHTML()` does. Pass one only to override.

### Face cards and backs

| Export | Description |
|--------|-------------|
| `FACE_CARD_SVG` | The 12 pixel-art J/Q/K faces, keyed `'<rank>_<suit>'` |
| `FC_PIP_ART` | Per-suit pip artwork the face cards embed |
| `FC_CORNERS(rank, suit, color)` | Corner indices sized for the face-card SVG viewbox — a function, despite the constant-style name |
| `getCardBackSVG()` | The card back, as SVG markup |

Every colour in this artwork is a `var(--fc-*, fallback)` reference, so a theme
override retints the faces without touching the markup. See
[CSS Variables](#css-variables).

---

## Chip Animation

### `drawChip(ctx, denom, cx, topY)`

Draw a single chip sprite onto a canvas **context**, centred on `cx` with its top
edge at `topY`.

| Param | Type |
|-------|------|
| `ctx` | `CanvasRenderingContext2D` |
| `denom` | `Denom` — an entry of `DENOMS` |
| `cx` / `topY` | `number` |

### `renderStack(canvas, denom, count)`

Draw a stack of like-valued chips. Takes a **canvas element, not a context** — it
sizes the canvas to fit the stack before drawing. Returns nothing.

| Param | Type | Description |
|-------|------|-------------|
| `canvas` | `HTMLCanvasElement` | Resized to fit; existing content is cleared |
| `denom` | `Denom` | An entry of `DENOMS` |
| `count` | `number` | Chips in the stack; the drawn height is capped |

### `breakIntoStacks(amount)`

Break a chip amount into `ChipStack[]` — `{ denom, count }` per denomination,
largest first.

### `DENOMS`

Array of 5 chip denominations: 500 (purple), 100 (black), 25 (green), 5 (red), 1 (white).

### `ChipAnim`

Stateful helper that renders a chip count into a page element. A plain object,
not a class.

| Method | Description |
|--------|-------------|
| `.init(displayId, legendId?)` | Element ids to render into; default `'chipDisplay'` / `'chipLegend'` |
| `.setChips(amount)` | Set the count and redraw stacks and legend |
| `.addChips(delta)` | Adjust the count and redraw; clamped at 0 |
| `.getChips()` | Current count |

A count of 0 renders a `B U S T` message instead of stacks.

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
