/**
 * Keyboard and touch input handling for puzzle games.
 * Arrow key support, touch swipe detection, event cleanup.
 */

import type { Direction } from './puzzle-game.js';

export interface PuzzleInputCallbacks {
  onMove: (direction: Direction) => void;
  isActive: () => boolean;
}

export interface PuzzleInput {
  destroy(): void;
}

const SWIPE_THRESHOLD = 30;

export function create(callbacks: PuzzleInputCallbacks, boardElement?: HTMLElement): PuzzleInput {
  let touchStartX = 0;
  let touchStartY = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners: Array<{ element: any; event: string; handler: (e: any) => void }> = [];

  function onKeyDown(e: KeyboardEvent) {
    if (!callbacks.isActive()) return;

    let direction: Direction | null = null;
    switch (e.key) {
      case 'ArrowUp':    direction = 'up'; break;
      case 'ArrowDown':  direction = 'down'; break;
      case 'ArrowLeft':  direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
    }

    if (direction) {
      e.preventDefault();
      callbacks.onMove(direction);
    }
  }

  function onTouchStart(e: TouchEvent) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const touch = e.touches[0]!;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    if (!callbacks.isActive()) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const touch = e.changedTouches[0]!;
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > SWIPE_THRESHOLD) {
      let direction: Direction;
      if (absDx > absDy) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      callbacks.onMove(direction);
    }
  }

  function setup() {
    document.addEventListener('keydown', onKeyDown);
    listeners.push({ element: document, event: 'keydown', handler: onKeyDown });

    if (boardElement) {
      boardElement.addEventListener('touchstart', onTouchStart, { passive: true });
      boardElement.addEventListener('touchend', onTouchEnd);
      listeners.push({ element: boardElement, event: 'touchstart', handler: onTouchStart });
      listeners.push({ element: boardElement, event: 'touchend', handler: onTouchEnd });
    }
  }

  function destroy() {
    for (const l of listeners) {
      l.element.removeEventListener(l.event, l.handler);
    }
    listeners.length = 0;
  }

  setup();

  return { destroy };
}
