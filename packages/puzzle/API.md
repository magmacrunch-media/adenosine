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
const game = AdPuzzle.createGame({ size: 4, type: 'fifteen' });
```

### PuzzleGame methods

| Method | Description |
|--------|-------------|
| `.shuffle()` | Randomize the board |
| `.move(direction)` | Slide a tile (`'up'`, `'down'`, `'left'`, `'right'`) |
| `.isSolved()` | Returns `boolean` |
| `.getState()` | Returns the current grid state |
| `.onStateChange(fn)` | Register a callback for state changes |

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
| `.start()` | Begin tracking (call when game starts) |
| `.getMoves()` | Returns current move count |
| `.getTime()` | Returns elapsed time in seconds |
| `.end()` | Stop tracking, return score entry |

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
| `PuzzleGrid.shuffle(grid)` | Shuffle tiles in-place |
| `PuzzleGrid.isSolved(grid)` | Check if tiles are in order |
| `PuzzleGrid.findEmpty(grid)` | Returns `{ row, col }` of the empty tile |
| `PuzzleGrid.canMove(grid, direction)` | Check if a move is valid |
| `PuzzleGrid.move(grid, direction)` | Execute a move, returns `boolean` |

---

## Types

### `PuzzleGameConfig`

```ts
interface PuzzleGameConfig {
  size: number;       // grid dimension (e.g. 4 for 4×4)
  type?: string;      // puzzle type identifier
}
```

### `Direction`

```ts
type Direction = 'up' | 'down' | 'left' | 'right';
```

### `PuzzleGame`

```ts
interface PuzzleGame {
  shuffle(): void;
  move(dir: Direction): boolean;
  isSolved(): boolean;
  getState(): number[][];
  onStateChange(fn: (info: StateChangeInfo) => void): void;
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
