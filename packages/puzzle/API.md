# API Reference — adenosine-puzzle

Sliding tile puzzle framework with grid engine, input, rendering, scoring, and UI.

## Table of Contents

- [createGame](#creategame) — Puzzle game instance
- [createUI](#createui) — DOM binding
- [createScoring](#createscoring) — High-score integration
- [createRenderer](#createrenderer) — Canvas rendering
- [createInput](#createinput) — Touch/mouse/keyboard input
- [PuzzleGrid](#puzzlegrid) — Grid math utilities
- [Types](#types)

---

## createGame

### `createGame(config)`

Create a puzzle game instance.

| Param | Type | Description |
|-------|------|-------------|
| `config` | `PuzzleGameConfig` | Game configuration |

Returns `PuzzleGame`.

```js
const game = AdPuzzle.createGame({ size: 4, gameName: 'fifteen-puzzle' });
game.init();
```

### PuzzleGame methods

| Method | Description |
|--------|-------------|
| `.init()` | Build the grid and seed it. Call before anything else — `.grid` is `null` until it runs. |
| `.handleMove(direction)` | Play a move (`'up'`, `'down'`, `'left'`, `'right'`). Returns `true` if the board changed. |
| `.moveInDirection(direction)` | The slide itself, without the move bookkeeping. Override to implement your puzzle's rules. |
| `.addRandomTile()` | Place one tile. Supply your own — the default does nothing. |
| `.addInitialTiles()` | Called by `.init()`; calls `.addRandomTile()` twice. |
| `.isActive()` | `false` once won or lost |
| `.checkGameState()` / `.checkWin()` | Re-evaluate win/lose state |
| `.getGrid()` / `.setGrid(grid)` | Read or replace the grid |
| `.getElapsedTime()` | Milliseconds since `.init()` |
| `.render()` | Invoke the `onRender` callback |
| `.notifyStateChange()` | Invoke the `onStateChange` callback |
| `.setOnRender(fn)` | Called after every render |
| `.setOnStateChange(fn)` | Called with `{ score, moves, … }` when state changes |
| `.setOnGameOver(fn)` / `.setOnWin(fn)` | Terminal-state callbacks |

Readable properties: `grid`, `score`, `moves`, `size`, `gameName`, `difficulty`,
`spawnTiles`, `gameOver`, `won`, `startTime`, `endTime`, `lastDirection`.

**`spawnTiles` gates spawning after each *move*, not at the start.** `.init()`
always calls `.addInitialTiles()`, which calls your `.addRandomTile()` twice, so
a board begins with two tiles even when `spawnTiles: false`.

---

## createUI

### `createUI(game, container)`

Bind a game to a DOM container. Creates the game board and handles tile rendering.

| Param | Type | Description |
|-------|------|-------------|
| `game` | `PuzzleGame` | Game instance from `createGame` |
| `container` | `HTMLElement` | DOM element to render into |

Returns `PuzzleUI`.

```js
const ui = AdPuzzle.createUI(game, document.getElementById('board'));
```

---

## createScoring

### `createScoring(game, scoreClient?)`

Connect high-score tracking to a puzzle game.

| Param | Type | Description |
|-------|------|-------------|
| `game` | `PuzzleGame` | Game instance |
| `scoreClient` | `ScoreClient` | Optional adenosine-score-client instance |

Returns `PuzzleScoring`.

```js
const scoring = AdPuzzle.createScoring(game, scoreClient);
```

### PuzzleScoring methods

| Method | Description |
|--------|-------------|
| `.addScore(entry)` | Record a finished game |
| `.getTopScores(difficulty?)` | Leaderboard, best first |
| `.getRank(score, difficulty?)` | Where a score would place |
| `.isNewHighScore(score, difficulty?)` | Whether it makes the table |
| `.getDifficulties()` | Difficulty keys that have scores |
| `.clearScores(difficulty?)` | Wipe stored scores |

Move counts and elapsed time come from the game, not the scorer —
`game.moves` and `game.getElapsedTime()`.

---

## createRenderer

### `createRenderer(game, canvas, config?)`

Low-level canvas renderer for custom layouts.

| Param | Type | Description |
|-------|------|-------------|
| `game` | `PuzzleGame` | Game instance |
| `canvas` | `HTMLCanvasElement` | Canvas to draw on |
| `config` | `PuzzleRenderConfig` | Optional rendering options |

Returns `PuzzleRender`.

---

## createInput

### `createInput(game, container, callbacks?)`

Handle touch, mouse, and keyboard input for tile sliding.

| Param | Type | Description |
|-------|------|-------------|
| `game` | `PuzzleGame` | Game instance |
| `container` | `HTMLElement` | Element to capture input on |
| `callbacks` | `PuzzleInputCallbacks` | Optional event callbacks |

Returns `PuzzleInput`.

---

## PuzzleGrid

Namespace with grid math utilities.

| Function | Description |
|----------|-------------|
| `PuzzleGrid.create(size)` | Create an empty grid |
| `PuzzleGrid.isSolved(grid)` | Check if tiles are in order |
| `PuzzleGrid.getEmptyCells(grid)` | Every empty cell, as `{ row, col }[]` |
| `PuzzleGrid.findCell(grid, value)` | Locate a value, or `null` |
| `PuzzleGrid.swap(grid, a, b)` | Exchange two cells |
| `PuzzleGrid.rotate(grid)` | Rotate the board |
| `PuzzleGrid.isFull(grid)` / `.isSolved(grid)` | Terminal-state tests |
| `PuzzleGrid.hasAdjacentMatches(grid)` | Whether any merge is still possible |
| `PuzzleGrid.getValues(grid)` / `.getMaxValue(grid)` / `.countValue(grid, v)` | Value queries |
| `PuzzleGrid.clone(grid)` / `.equals(a, b)` / `.gridToString(grid)` | Copy, compare, debug |

Moves live on the game (`game.handleMove(dir)`), not on the grid — `PuzzleGrid`
is pure board math.

---

## Types

### `PuzzleGameConfig`

```ts
interface PuzzleGameConfig {
  size?: number;         // grid dimension, default 4
  gameName?: string;     // used as the scoring key
  difficulty?: string;
  spawnTiles?: boolean;  // spawn after each move, default true
}
```

### `Direction`

```ts
type Direction = 'up' | 'down' | 'left' | 'right';
```

### `PuzzleGame`

```ts
interface PuzzleGame {
  init(): void;
  handleMove(dir: Direction): boolean;
  moveInDirection(dir: Direction): void;
  addRandomTile(): void;
  isActive(): boolean;
  getGrid(): PuzzleGridType;
  setGrid(g: PuzzleGridType): void;
  getElapsedTime(): number;
  setOnRender(cb: (game: PuzzleGame) => void): void;
  setOnStateChange(cb: (info: StateChangeInfo) => void): void;
  setOnGameOver(cb: (game: PuzzleGame) => void): void;
  setOnWin(cb: (game: PuzzleGame) => void): void;
}
```

### `StateChangeInfo`

```ts
interface StateChangeInfo {
  direction: Direction;
  solved: boolean;
  moves: number;
}
```
