# Bandaniel Engine

A lightweight 2D tile-based game engine extracted from **The Ballad of Bandaniel**. Written as ES modules — import what you need.

## Quick Start

```html
<script type="module">
import { initCanvas, player, createGameLoop, initInput, updateCamera, renderWorld, setCurrentMap, setMap, setGameStarted } from './engine/index.js';

// Setup
const canvas = document.getElementById('gameCanvas');
initCanvas(canvas);

// Configure player start
player.x = 10;
player.y = 10;

// Your tile map (2D array of tile IDs)
const myMap = [
  [2,2,2,2,2],
  [2,0,0,0,2],
  [2,0,0,0,2],
  [2,2,2,2,2],
];
const maps = { level1: myMap };
setCurrentMap('level1');
setMap(myMap);

// Tile rendering callback
function drawTile(ctx, x, y, tileId) {
  const colors = { 0: '#7cb342', 2: '#5d4037' };
  ctx.fillStyle = colors[tileId] || '#000';
  ctx.fillRect(x, y, 16, 16);
}

// Game loop
const loop = createGameLoop({
  update: () => {
    updateCamera(player, 16);
    // ... your update logic
  },
  render: () => {
    renderWorld({
      map: myMap,
      tileSize: 16,
      renderTile: drawTile,
      layers: [{ sortY: player.y, render: (ctx) => { /* draw player */ } }],
    });
  },
  fps: 30,
});

// Start
setGameStarted(true);
loop.start();
</script>
```

## Modules

| Module | Description |
|--------|-------------|
| `state.js` | Shared game state (player, map, flags) |
| `game-loop.js` | requestAnimationFrame loop with FPS limiting |
| `input.js` | Keyboard input tracking |
| `camera.js` | Smooth-follow camera |
| `collision.js` | Tile + entity + prop collision |
| `movement.js` | Player movement with collision |
| `renderer.js` | Y-sorted rendering pipeline, sprite registry |
| `inventory.js` | Two-hand inventory with backpack storage |
| `notifications.js` | SNES-style floating messages |
| `health.js` | Damage/healing system |
| `transitions.js` | Map enter/exit with position locking |

## Design Philosophy

- **No globals** — everything is imported/exported
- **No opinions** — the engine provides systems, you wire them together
- **Configurable** — pass callbacks and data, don't inherit from base classes
- **Tiny** — ~400 lines total, no dependencies
