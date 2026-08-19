# @magmacrunch/adenosine-cards

A 52-card deck with pixel-art SVG rendering, poker and cribbage hand evaluation,
and animated chips. No runtime dependencies.

```bash
npm install @magmacrunch/adenosine-cards
```

## Use

```js
import { Card, Deck } from '@magmacrunch/adenosine-cards';
import '@magmacrunch/adenosine-cards/cards.css';

const deck = new Deck();
deck.shuffle();

const card = deck.deal();
card.flip();
document.getElementById('hand').appendChild(card.getHTML());
```

`getHTML()` returns an `HTMLDivElement`, not a string — append it directly.

### Hand evaluation

```js
import { HandEvaluator } from '@magmacrunch/adenosine-cards';

// HandEvaluator is a class — construct it, then evaluate.
const { name, rank, points, description } = new HandEvaluator().evaluate(sevenCards);
// name: 'Full House', rank: 6
```

Cribbage scoring lives alongside it, returning `{ total, breakdown }` for a hand
and `{ points, description }` for a pegging play.

### Types

`Suit`, `Rank`, `HandName` and the hand-result shapes are exported, derived from
the constant tables rather than written out by hand.

## Without a bundler

```html
<link rel="stylesheet" href="cards.css">
<script src="adenosine-cards.js"></script>
<script>
  const deck = new AdCards.Deck();
  deck.shuffle();
</script>
```

The IIFE build is `dist/index.global.js` and exposes `window.AdCards`.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
