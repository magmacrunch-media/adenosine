/**
 * Grid and tile rendering for puzzle games.
 */

import type { PuzzleGrid } from './puzzle-grid.js';

export interface TileInfo {
  text: string;
  classes?: string[];
  attributes?: Record<string, string>;
}

export interface PuzzleRenderConfig {
  tileClass?: string;
  emptyClass?: string;
}

export interface PuzzleRender {
  renderGrid(grid: PuzzleGrid, tileRenderer?: (row: number, col: number, value: number) => HTMLElement): void;
  renderGridWithSpecial(grid: PuzzleGrid, getTileContent: (value: number) => TileInfo): void;
  createDefaultTile(row: number, col: number, value: number): HTMLElement;
  updateTile(row: number, col: number, value: number, extraClasses?: string[]): void;
  getTile(row: number, col: number): HTMLElement | null;
  getAllTiles(): NodeListOf<HTMLElement>;
  clear(): void;
}

export function create(boardElement: HTMLElement, config: PuzzleRenderConfig = {}): PuzzleRender {
  const tileClass = config.tileClass ?? 'tile';
  const emptyClass = config.emptyClass ?? 'tile-empty';

  function renderGrid(grid: PuzzleGrid, tileRenderer?: (row: number, col: number, value: number) => HTMLElement) {
    boardElement.innerHTML = '';
    for (let r = 0; r < grid.size; r++) {
      for (let c = 0; c < grid.size; c++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const value = grid.board[r]![c]!;
        const tile = tileRenderer
          ? tileRenderer(r, c, value)
          : createDefaultTile(r, c, value);
        boardElement.appendChild(tile);
      }
    }
  }

  function createDefaultTile(row: number, col: number, value: number): HTMLElement {
    const tile = document.createElement('div');
    tile.className = tileClass;
    tile.dataset.row = String(row);
    tile.dataset.col = String(col);

    if (value === 0) {
      tile.classList.add(emptyClass);
    } else {
      tile.textContent = String(value);
      tile.dataset.value = String(value);
    }

    return tile;
  }

  function renderGridWithSpecial(grid: PuzzleGrid, getTileContent: (value: number) => TileInfo) {
    boardElement.innerHTML = '';
    for (let r = 0; r < grid.size; r++) {
      for (let c = 0; c < grid.size; c++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const value = grid.board[r]![c]!;
        const tileInfo = getTileContent(value);

        const tile = document.createElement('div');
        tile.className = tileClass;
        tile.dataset.row = String(r);
        tile.dataset.col = String(c);

        if (value === 0) {
          tile.classList.add(emptyClass);
        } else {
          tile.textContent = tileInfo.text;
          if (tileInfo.classes) {
            tileInfo.classes.forEach((cls) => tile.classList.add(cls));
          }
          if (tileInfo.attributes) {
            for (const [key, val] of Object.entries(tileInfo.attributes)) {
              tile.dataset[key] = val;
            }
          }
        }

        boardElement.appendChild(tile);
      }
    }
  }

  function updateTile(row: number, col: number, value: number, extraClasses?: string[]) {
    const tile = boardElement.querySelector(
      `[data-row="${row}"][data-col="${col}"]`,
    ) as HTMLElement | null;
    if (!tile) return;

    tile.className = tileClass;
    tile.textContent = '';
    tile.dataset.value = '';

    if (value === 0) {
      tile.classList.add(emptyClass);
    } else {
      tile.textContent = String(value);
      tile.dataset.value = String(value);
    }

    if (extraClasses) {
      extraClasses.forEach((cls) => tile.classList.add(cls));
    }
  }

  function getTile(row: number, col: number): HTMLElement | null {
    return boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  function getAllTiles(): NodeListOf<HTMLElement> {
    return boardElement.querySelectorAll(`.${tileClass}`);
  }

  function clear() {
    boardElement.innerHTML = '';
  }

  return {
    renderGrid,
    renderGridWithSpecial,
    createDefaultTile,
    updateTile,
    getTile,
    getAllTiles,
    clear,
  };
}
