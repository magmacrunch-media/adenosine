/**
 * Game state machine for sliding tile puzzles.
 * Provides game lifecycle, move handling, win/loss detection.
 */

import * as PuzzleGrid from './puzzle-grid.js';
import type { PuzzleGrid as PuzzleGridType } from './puzzle-grid.js';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PuzzleGameConfig {
  size?: number;
  difficulty?: string;
  gameName?: string;
  spawnTiles?: boolean;
}

export interface StateChangeInfo {
  score: number;
  moves: number;
  gameOver: boolean;
  won: boolean;
  elapsed: number;
  grid: PuzzleGridType;
}

export interface PuzzleGame {
  readonly size: number;
  readonly difficulty: string;
  readonly gameName: string;
  readonly spawnTiles: boolean;
  readonly lastDirection: Direction | null;
  grid: PuzzleGridType;
  score: number;
  moves: number;
  gameOver: boolean;
  won: boolean;
  readonly startTime: number | null;
  endTime: number | null;

  addRandomTile(): void;
  moveLeft(): void;
  checkWin(): boolean;
  checkGameState(): void;
  addInitialTiles(): void;

  init(): void;
  isActive(): boolean;
  getElapsedTime(): number;
  handleMove(direction: Direction): boolean;
  moveInDirection(direction: Direction): void;
  notifyStateChange(): void;
  render(): void;

  setOnRender(cb: (game: PuzzleGame) => void): void;
  setOnStateChange(cb: (info: StateChangeInfo) => void): void;
  setOnGameOver(cb: (game: PuzzleGame) => void): void;
  setOnWin(cb: (game: PuzzleGame) => void): void;

  getGrid(): PuzzleGridType;
  setGrid(g: PuzzleGridType): void;
}

export function create(config: PuzzleGameConfig = {}): PuzzleGame {
  const size = config.size ?? 4;
  const difficulty = config.difficulty ?? 'normal';
  const gameName = config.gameName ?? 'puzzle';
  const spawnTiles = config.spawnTiles ?? true;

  let _grid: PuzzleGridType | null = null;
  let _score = 0;
  let _moves = 0;
  let _gameOver = false;
  let _won = false;
  let _startTime: number | null = null;
  let _endTime: number | null = null;
  let _lastDirection: Direction | null = null;

  let onRender: ((game: PuzzleGame) => void) | null = null;
  let onStateChange: ((info: StateChangeInfo) => void) | null = null;
  let onGameOver: ((game: PuzzleGame) => void) | null = null;
  let onWin: ((game: PuzzleGame) => void) | null = null;

  const api: PuzzleGame = {
    get size() { return size; },
    get difficulty() { return difficulty; },
    get gameName() { return gameName; },
    get spawnTiles() { return spawnTiles; },
    get lastDirection() { return _lastDirection; },
    get grid() { return _grid!; },
    set grid(val) { _grid = val; },
    get score() { return _score; },
    set score(val) { _score = val; api.notifyStateChange(); },
    get moves() { return _moves; },
    set moves(val) { _moves = val; },
    get gameOver() { return _gameOver; },
    set gameOver(val) { _gameOver = val; },
    get won() { return _won; },
    set won(val) { _won = val; },
    get startTime() { return _startTime; },
    get endTime() { return _endTime; },
    set endTime(val) { _endTime = val; },

    addRandomTile() {},
    moveLeft() {},
    checkWin() { return false; },

    checkGameState() {
      if (api.checkWin()) {
        _won = true;
        _endTime = Date.now();
        if (onWin) onWin(api);
        api.notifyStateChange();
        return;
      }
      if (PuzzleGrid.isFull(_grid!) && !PuzzleGrid.hasAdjacentMatches(_grid!)) {
        _gameOver = true;
        _endTime = Date.now();
        if (onGameOver) onGameOver(api);
        api.notifyStateChange();
      }
    },

    addInitialTiles() {
      api.addRandomTile();
      api.addRandomTile();
    },

    init() {
      _grid = PuzzleGrid.create(size);
      _score = 0;
      _moves = 0;
      _gameOver = false;
      _won = false;
      _startTime = Date.now();
      _endTime = null;
      api.addInitialTiles();
      api.render();
    },

    isActive() {
      return !_gameOver && !_won;
    },

    getElapsedTime() {
      if (!_startTime) return 0;
      const end = _endTime || Date.now();
      return Math.floor((end - _startTime) / 1000);
    },

    handleMove(direction) {
      if (!api.isActive()) return false;
      const original = PuzzleGrid.clone(_grid!);
      api.moveInDirection(direction);
      const moved = !PuzzleGrid.equals(_grid!, original);
      if (moved) {
        _moves++;
        _lastDirection = direction;
        if (spawnTiles) {
          api.addRandomTile();
        }
        api.checkGameState();
        api.render();
      }
      return moved;
    },

    moveInDirection(direction) {
      switch (direction) {
        case 'left':
          api.moveLeft();
          break;
        case 'right':
          PuzzleGrid.rotate(_grid!, 2);
          api.moveLeft();
          PuzzleGrid.rotate(_grid!, 2);
          break;
        case 'up':
          PuzzleGrid.rotate(_grid!, 3);
          api.moveLeft();
          PuzzleGrid.rotate(_grid!, 1);
          break;
        case 'down':
          PuzzleGrid.rotate(_grid!, 1);
          api.moveLeft();
          PuzzleGrid.rotate(_grid!, 3);
          break;
      }
    },

    notifyStateChange() {
      if (onStateChange) {
        onStateChange({
          score: _score,
          moves: _moves,
          gameOver: _gameOver,
          won: _won,
          elapsed: api.getElapsedTime(),
          grid: _grid!,
        });
      }
    },

    render() {
      if (onRender) {
        onRender(api);
      }
    },

    setOnRender(cb) { onRender = cb; },
    setOnStateChange(cb) { onStateChange = cb; },
    setOnGameOver(cb) { onGameOver = cb; },
    setOnWin(cb) { onWin = cb; },

    getGrid() { return _grid!; },
    setGrid(g) { _grid = g; },
  };

  return api;
}
