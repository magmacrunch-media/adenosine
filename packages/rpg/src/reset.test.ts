/**
 * @vitest-environment jsdom
 *
 * The engine keeps one shared copy of player, map, camera, keys and the event
 * bus. That is deliberate, but it left no way back to the starting values, and
 * the workaround had been written by hand three times: three playground
 * examples open with `player.health = 100`, sixteen test files reset the same
 * globals in beforeEach, and input.ts grew a private `_resetInputState`.
 *
 * These assert the real thing does what all three were reaching for.
 */
import { describe, it, expect, vi } from 'vitest';
import { resetEngine } from './reset.js';
import { player, map, currentMap, gameStarted, gamePaused, gameOver, transitionCooldown, frameCounter, canvas, ctx, setMap, setCurrentMap, setGameStarted, setGamePaused, setGameOver, setTransitionCooldown, setFrameCounter, initCanvas } from './state.js';
import { camera } from './camera.js';
import { keys, keysPressed, initInput } from './input.js';
import { engine, createEventBus } from './events.js';
import { damagePlayer, setOnGameOverCallback } from './health.js';

describe('resetEngine', () => {
  it('restores the player to full health and origin', () => {
    player.x = 12;
    player.y = 7;
    player.health = 3;
    player.direction = 'left';
    player.positionLocked = true;

    resetEngine();

    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
    expect(player.health).toBe(100);
    expect(player.maxHealth).toBe(100);
    expect(player.direction).toBe('down');
    expect(player.positionLocked).toBe(false);
  });

  it('clears map, flags and counters', () => {
    setMap([[1, 2], [3, 4]]);
    setCurrentMap('house');
    setGameStarted(true);
    setGamePaused(true);
    setGameOver(true);
    setTransitionCooldown(42);
    setFrameCounter(99);
    camera.x = 300;
    camera.y = 300;

    resetEngine();

    expect(map).toEqual([]);
    expect(currentMap).toBe('default');
    expect(gameStarted).toBe(false);
    expect(gamePaused).toBe(false);
    expect(gameOver).toBe(false);
    expect(transitionCooldown).toBe(0);
    expect(frameCounter).toBe(0);
    expect(camera).toEqual({ x: 0, y: 0 });
  });

  // The bug this exists for. The playground re-runs example code against a bus
  // that outlives the script tag, and `off` needs a reference an inline closure
  // never kept -- so every Run added another full set of handlers.
  it('drops event listeners instead of stacking them across runs', () => {
    const seen = vi.fn();
    for (let run = 0; run < 3; run++) {
      resetEngine();
      engine.on('player-died', seen);
    }

    engine.emit('player-died', { health: 0 });

    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('forgets a game-over callback, which closes over a dead scene', () => {
    const onGameOver = vi.fn();
    setOnGameOverCallback(onGameOver);

    resetEngine();

    player.health = 10;
    damagePlayer(50);
    expect(onGameOver).not.toHaveBeenCalled();
  });

  it('detaches input listeners and forgets held keys', () => {
    initInput();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(keys['d']).toBe(true);

    resetEngine();
    expect(keys['d']).toBeUndefined();
    expect(keysPressed['d']).toBeUndefined();

    // Detached, so a later key does not quietly repopulate the map.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(keys['d']).toBeUndefined();
  });

  // A render target, not game state. Clearing it would force an initCanvas on a
  // caller who only wanted to restart a level.
  it('leaves the canvas and context bound', () => {
    const el = document.createElement('canvas');
    initCanvas(el);
    const boundCtx = ctx;
    expect(canvas).toBe(el);

    resetEngine();

    expect(canvas).toBe(el);
    expect(ctx).toBe(boundCtx);
  });
});

describe('EventBus.clear', () => {
  it('clears one event without touching the others', () => {
    const bus = createEventBus();
    const died = vi.fn();
    const paused = vi.fn();
    bus.on('player-died', died);
    bus.on('pause-toggle', paused);

    bus.clear('player-died');
    bus.emit('player-died', { health: 0 });
    bus.emit('pause-toggle');

    expect(died).not.toHaveBeenCalled();
    expect(paused).toHaveBeenCalledTimes(1);
  });

  it('clears every event when called with no argument', () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on('player-died', fn);
    bus.on('pause-toggle', fn);

    bus.clear();
    bus.emit('player-died', { health: 0 });
    bus.emit('pause-toggle');

    expect(fn).not.toHaveBeenCalled();
  });
});
