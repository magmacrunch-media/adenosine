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

Straight from a CDN — no npm, no build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-cards@0.7/cards.css">
<script src="https://cdn.jsdelivr.net/npm/@magmacrunch/adenosine-cards@0.7/dist/index.global.js"></script>
```

The IIFE build exposes `window.AdCards`. The version is pinned to a minor here on purpose:
an unpinned URL follows `latest` and will cross a major without warning.

Installed from npm instead, the same file is `dist/index.global.js`.

## Full API

[`API.md`](API.md) documents every export, with parameters and return shapes.

## Theming

Every colour is a custom property with a fallback. Override any of them on a
containing element — nothing needs to be set for the deck to look right.

| Property | Default | What it colours |
|---|---|---|
| `--card-face-bg` | `#fffef5` | Face-up card background |
| `--card-back-bg` | `#1a3a8a` | Card back |
| `--fc-red` | `#cc0000` | Hearts and diamonds |
| `--fc-black` | `#111111` | Spades and clubs |
| `--retro-gold` | `#ffd700` | `.selected` outline |
| `--cyan` / `--cyan-dim` / `--cyan-glow` | `#00e5ff` / `#0099bb` / 30% cyan | Stock-reset control |

The face-card pixel art is inline SVG and reads its own set, which is **not**
discoverable from the stylesheet:

| Property | Default | |
|---|---|---|
| `--fc-art-bg` / `--fc-card-bg` | `#fffef5` | Art panel and card ground |
| `--fc-skin` | `#f5cba7` | Faces and hands |
| `--fc-blue` | `#1a3a8a` | Robes |
| `--fc-gold` | `#d4a017` | Crowns, trim |
| `--fc-steel` | `#8899aa` | Swords, armour |

```css
.midnight-deck {
  --card-face-bg: #1b1b2e;
  --fc-card-bg:   #1b1b2e;
  --fc-art-bg:    #1b1b2e;
  --fc-red:       #ff5c8a;
  --fc-black:     #9fb8ff;
}
```

## Module format

ESM only. The `exports` map declares no `require` condition, so this cannot be
`require()`d from CommonJS — use `import`, or the IIFE build above.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
