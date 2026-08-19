# @magmacrunch/adenosine-puzzle

Sliding tile puzzle framework — grid engine, input handling, rendering and
scoring. Powers 2048-likes, fifteen-puzzles and Klotski variants. No runtime
dependencies.

```bash
npm install @magmacrunch/adenosine-puzzle
```

## Use

The framework owns the grid, input and scoring; you supply the move rules,
because that is what differs between puzzles.

```js
import { PuzzleGrid, createGame, createInput, createRenderer, createScoring }
  from '@magmacrunch/adenosine-puzzle';

const board = document.getElementById('board');
const renderer = createRenderer(board);
const scoring = createScoring('fifteen-puzzle');

const game = createGame({ size: 4, gameName: 'fifteen-puzzle', spawnTiles: false });

game.addRandomTile = () => {
  const empty = PuzzleGrid.getEmptyCells(game.grid);
  if (!empty.length) return;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  game.grid.board[cell.row][cell.col] = Math.random() < 0.9 ? 1 : 2;
};

game.moveLeft = () => { /* your sliding + merge rules */ };

game.setOnRender(() => renderer.renderGrid(game.grid));
game.setOnStateChange((info) => {
  document.getElementById('score').textContent = info.score;
});

createInput({ onMove: (dir) => game.handleMove(dir), isActive: () => game.isActive() }, board);
game.init();
```

## Without a bundler

```html
<script src="adenosine-puzzle.js"></script>
<script>const game = AdPuzzle.createGame({ size: 4, gameName: 'threes' });</script>
```

The IIFE build is `dist/index.global.js` and exposes `window.AdPuzzle`.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
