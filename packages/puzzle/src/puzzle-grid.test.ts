import { describe, it, expect } from 'vitest';
import * as PuzzleGrid from './puzzle-grid.js';

describe('PuzzleGrid', () => {
  describe('create()', () => {
    it('creates a square grid', () => {
      const grid = PuzzleGrid.create(4);
      expect(grid.size).toBe(4);
      expect(grid.cols).toBe(4);
      expect(grid.rows).toBe(4);
      expect(grid.board).toHaveLength(4);
      expect(grid.board[0]).toHaveLength(4);
    });

    it('creates a rectangular grid', () => {
      const grid = PuzzleGrid.create(3, 5);
      expect(grid.cols).toBe(3);
      expect(grid.rows).toBe(5);
      expect(grid.board).toHaveLength(5);
      expect(grid.board[0]).toHaveLength(3);
    });

    it('fills with zeros', () => {
      const grid = PuzzleGrid.create(3);
      for (const row of grid.board) {
        for (const cell of row) {
          expect(cell).toBe(0);
        }
      }
    });
  });

  describe('clone()', () => {
    it('creates a deep copy', () => {
      const grid = PuzzleGrid.create(3);
      grid.board[0][0] = 5;
      const copy = PuzzleGrid.clone(grid);
      expect(copy.board[0][0]).toBe(5);
      copy.board[0][0] = 99;
      expect(grid.board[0][0]).toBe(5);
    });

    it('preserves dimensions', () => {
      const grid = PuzzleGrid.create(3, 5);
      const copy = PuzzleGrid.clone(grid);
      expect(copy.cols).toBe(3);
      expect(copy.rows).toBe(5);
    });
  });

  describe('getEmptyCells()', () => {
    it('returns all cells for empty grid', () => {
      const grid = PuzzleGrid.create(3);
      const empty = PuzzleGrid.getEmptyCells(grid);
      expect(empty).toHaveLength(9);
    });

    it('excludes filled cells', () => {
      const grid = PuzzleGrid.create(2);
      grid.board[0][0] = 1;
      grid.board[1][1] = 2;
      const empty = PuzzleGrid.getEmptyCells(grid);
      expect(empty).toHaveLength(2);
    });
  });

  describe('isFull()', () => {
    it('returns false for empty grid', () => {
      expect(PuzzleGrid.isFull(PuzzleGrid.create(3))).toBe(false);
    });

    it('returns true when full', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 2], [3, 4]];
      expect(PuzzleGrid.isFull(grid)).toBe(true);
    });
  });

  describe('rotate()', () => {
    it('rotates 90 degrees clockwise', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 2], [3, 4]];
      PuzzleGrid.rotate(grid);
      expect(grid.board).toEqual([[3, 1], [4, 2]]);
    });

    it('rotates 180 degrees (2 times)', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 2], [3, 4]];
      PuzzleGrid.rotate(grid, 2);
      expect(grid.board).toEqual([[4, 3], [2, 1]]);
    });

    it('does nothing for non-square grids', () => {
      const grid = PuzzleGrid.create(2, 3);
      grid.board = [[1, 2], [3, 4], [5, 6]];
      const before = PuzzleGrid.clone(grid);
      PuzzleGrid.rotate(grid);
      expect(PuzzleGrid.equals(grid, before)).toBe(true);
    });
  });

  describe('equals()', () => {
    it('returns true for identical grids', () => {
      const g1 = PuzzleGrid.create(2);
      const g2 = PuzzleGrid.create(2);
      expect(PuzzleGrid.equals(g1, g2)).toBe(true);
    });

    it('returns false for different grids', () => {
      const g1 = PuzzleGrid.create(2);
      const g2 = PuzzleGrid.create(2);
      g1.board[0][0] = 1;
      expect(PuzzleGrid.equals(g1, g2)).toBe(false);
    });

    it('returns false for different dimensions', () => {
      const g1 = PuzzleGrid.create(2);
      const g2 = PuzzleGrid.create(3);
      expect(PuzzleGrid.equals(g1, g2)).toBe(false);
    });
  });

  describe('hasAdjacentMatches()', () => {
    it('returns false for empty grid', () => {
      expect(PuzzleGrid.hasAdjacentMatches(PuzzleGrid.create(3))).toBe(false);
    });

    it('detects horizontal matches', () => {
      const grid = PuzzleGrid.create(3);
      grid.board[0] = [2, 2, 0];
      expect(PuzzleGrid.hasAdjacentMatches(grid)).toBe(true);
    });

    it('detects vertical matches', () => {
      const grid = PuzzleGrid.create(3);
      grid.board[0][0] = 2;
      grid.board[1][0] = 2;
      expect(PuzzleGrid.hasAdjacentMatches(grid)).toBe(true);
    });

    it('ignores zeros', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[0, 0], [0, 0]];
      expect(PuzzleGrid.hasAdjacentMatches(grid)).toBe(false);
    });
  });

  describe('getValues()', () => {
    it('returns non-zero values', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 0], [0, 4]];
      expect(PuzzleGrid.getValues(grid)).toEqual([1, 4]);
    });
  });

  describe('getMaxValue()', () => {
    it('returns 0 for empty grid', () => {
      expect(PuzzleGrid.getMaxValue(PuzzleGrid.create(2))).toBe(0);
    });

    it('returns max value', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 8], [4, 2]];
      expect(PuzzleGrid.getMaxValue(grid)).toBe(8);
    });
  });

  describe('countValue()', () => {
    it('counts occurrences', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[2, 2], [2, 0]];
      expect(PuzzleGrid.countValue(grid, 2)).toBe(3);
    });
  });

  describe('findCell()', () => {
    it('finds position of value', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[0, 5], [3, 0]];
      expect(PuzzleGrid.findCell(grid, 5)).toEqual({ row: 0, col: 1 });
    });

    it('returns null if not found', () => {
      const grid = PuzzleGrid.create(2);
      expect(PuzzleGrid.findCell(grid, 99)).toBeNull();
    });
  });

  describe('swap()', () => {
    it('swaps two cells', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 2], [3, 4]];
      PuzzleGrid.swap(grid, 0, 0, 1, 1);
      expect(grid.board[0][0]).toBe(4);
      expect(grid.board[1][1]).toBe(1);
    });
  });

  describe('isSolved()', () => {
    it('returns true when board matches target', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 2], [3, 4]];
      expect(PuzzleGrid.isSolved(grid, [[1, 2], [3, 4]])).toBe(true);
    });

    it('returns false when board differs', () => {
      const grid = PuzzleGrid.create(2);
      grid.board = [[1, 2], [3, 4]];
      expect(PuzzleGrid.isSolved(grid, [[4, 3], [2, 1]])).toBe(false);
    });
  });
});
