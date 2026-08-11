import { describe, it, expect, vi } from 'vitest';
import { create as createGame } from './puzzle-game.js';

describe('PuzzleGame', () => {
  describe('create()', () => {
    it('creates a game with defaults', () => {
      const game = createGame();
      expect(game.size).toBe(4);
      expect(game.difficulty).toBe('normal');
      expect(game.gameName).toBe('puzzle');
      expect(game.spawnTiles).toBe(true);
    });

    it('creates a game with custom config', () => {
      const game = createGame({ size: 5, difficulty: 'hard', gameName: 'threes' });
      expect(game.size).toBe(5);
      expect(game.difficulty).toBe('hard');
      expect(game.gameName).toBe('threes');
    });
  });

  describe('init()', () => {
    it('initializes game state', () => {
      const game = createGame({ size: 4 });
      game.addRandomTile = () => {};
      game.init();
      expect(game.score).toBe(0);
      expect(game.moves).toBe(0);
      expect(game.gameOver).toBe(false);
      expect(game.won).toBe(false);
      expect(game.grid).toBeTruthy();
      expect(game.startTime).toBeTruthy();
    });
  });

  describe('isActive()', () => {
    it('returns true initially', () => {
      const game = createGame();
      game.addRandomTile = () => {};
      game.init();
      expect(game.isActive()).toBe(true);
    });

    it('returns false when game over', () => {
      const game = createGame();
      game.addRandomTile = () => {};
      game.init();
      game.gameOver = true;
      expect(game.isActive()).toBe(false);
    });

    it('returns false when won', () => {
      const game = createGame();
      game.addRandomTile = () => {};
      game.init();
      game.won = true;
      expect(game.isActive()).toBe(false);
    });
  });

  describe('handleMove()', () => {
    it('returns false when inactive', () => {
      const game = createGame();
      game.addRandomTile = () => {};
      game.init();
      game.gameOver = true;
      expect(game.handleMove('left')).toBe(false);
    });

    it('increments moves when board changes', () => {
      const game = createGame({ spawnTiles: false });
      let moveCount = 0;
      game.moveLeft = () => {
        // Simulate a move by shifting values
        game.grid.board[0][0] = 1;
        game.grid.board[0][1] = 2;
        game.grid.board[0][2] = 3;
        game.grid.board[0][3] = 4;
      };
      game.init();
      game.handleMove('left');
      expect(game.moves).toBe(1);
    });

    it('does not increment when nothing changes', () => {
      const game = createGame({ spawnTiles: false });
      game.moveLeft = () => {}; // no-op
      game.init();
      game.handleMove('left');
      expect(game.moves).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('setOnStateChange fires on score change', () => {
      const game = createGame();
      game.addRandomTile = () => {};
      game.init();
      const cb = vi.fn();
      game.setOnStateChange(cb);
      game.score = 100;
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({ score: 100 }),
      );
    });
  });

  describe('getElapsedTime()', () => {
    it('returns 0 before init', () => {
      const game = createGame();
      expect(game.getElapsedTime()).toBe(0);
    });
  });
});
