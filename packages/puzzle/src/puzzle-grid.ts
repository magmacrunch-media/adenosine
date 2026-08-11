/**
 * Core grid engine for sliding tile puzzles.
 * Supports both square (NxN) and rectangular (CxR) grids.
 */

export interface PuzzleGrid {
  size: number;
  cols: number;
  rows: number;
  board: number[][];
}

export interface CellPosition {
  row: number;
  col: number;
}

function cell(board: number[][], r: number, c: number): number {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return board[r]![c]!;
}

function setCell(board: number[][], r: number, c: number, val: number): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  board[r]![c] = val;
}

export function create(cols: number, rows?: number): PuzzleGrid {
  rows = rows ?? cols;
  const board: number[][] = [];
  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      board[r]![c] = 0;
    }
  }
  return { size: cols, cols, rows, board };
}

export function clone(grid: PuzzleGrid): PuzzleGrid {
  const copy: number[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    copy[r] = grid.board[r]!.slice();
  }
  return { size: grid.size, cols: grid.cols, rows: grid.rows, board: copy };
}

export function getEmptyCells(grid: PuzzleGrid): CellPosition[] {
  const cells: CellPosition[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (cell(grid.board, r, c) === 0) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

export function isFull(grid: PuzzleGrid): boolean {
  return getEmptyCells(grid).length === 0;
}

export function rotate(grid: PuzzleGrid, times = 1): void {
  if (grid.cols !== grid.rows) {
    console.warn('PuzzleGrid.rotate: rotation not supported for non-square grids');
    return;
  }
  for (let t = 0; t < times; t++) {
    const newBoard: number[][] = [];
    for (let r = 0; r < grid.size; r++) {
      newBoard[r] = [];
    }
    for (let r = 0; r < grid.size; r++) {
      for (let c = 0; c < grid.size; c++) {
        setCell(newBoard, c, grid.size - 1 - r, cell(grid.board, r, c));
      }
    }
    grid.board = newBoard;
  }
}

export function equals(grid1: PuzzleGrid, grid2: PuzzleGrid): boolean {
  if (grid1.cols !== grid2.cols || grid1.rows !== grid2.rows) return false;
  for (let r = 0; r < grid1.rows; r++) {
    for (let c = 0; c < grid1.cols; c++) {
      if (cell(grid1.board, r, c) !== cell(grid2.board, r, c)) return false;
    }
  }
  return true;
}

export function hasAdjacentMatches(grid: PuzzleGrid): boolean {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const val = cell(grid.board, r, c);
      if (val === 0) continue;
      if (c < grid.cols - 1 && cell(grid.board, r, c + 1) === val) return true;
      if (r < grid.rows - 1 && cell(grid.board, r + 1, c) === val) return true;
    }
  }
  return false;
}

export function getValues(grid: PuzzleGrid): number[] {
  const values: number[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const v = cell(grid.board, r, c);
      if (v !== 0) values.push(v);
    }
  }
  return values;
}

export function getMaxValue(grid: PuzzleGrid): number {
  let max = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const v = cell(grid.board, r, c);
      if (v > max) max = v;
    }
  }
  return max;
}

export function countValue(grid: PuzzleGrid, value: number): number {
  let count = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (cell(grid.board, r, c) === value) count++;
    }
  }
  return count;
}

export function findCell(grid: PuzzleGrid, value: number): CellPosition | null {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (cell(grid.board, r, c) === value) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function swap(grid: PuzzleGrid, r1: number, c1: number, r2: number, c2: number): void {
  const temp = cell(grid.board, r1, c1);
  setCell(grid.board, r1, c1, cell(grid.board, r2, c2));
  setCell(grid.board, r2, c2, temp);
}

export function isSolved(grid: PuzzleGrid, targetBoard: number[][]): boolean {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (cell(grid.board, r, c) !== cell(targetBoard, r, c)) return false;
    }
  }
  return true;
}

export function gridToString(grid: PuzzleGrid): string {
  let s = '';
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const v = cell(grid.board, r, c);
      s += (v === 0 ? '.' : v);
      s += '\t';
    }
    s += '\n';
  }
  return s;
}
