# Magma Engine

A lightweight, zero-dependency 2D tile-based game engine. Written as ES modules — import what you need.

## Features

- **Fixed-timestep game loop** with delta-time support
- **Tile-based movement** with collision detection and diagonal normalization
- **Smooth camera** with bounds clamping
- **Y-sorted rendering** with sprite registry
- **Event system** (pub/sub) for inter-module communication
- **Configurable input** with customizable key bindings
- **Dialogue system** with multi-line text and choice menus
- **Interaction dispatch** with priority-based SPACE bar handling
- **NPC and enemy management** with patrol AI
- **Inventory system** with two-hand slots and backpack storage
- **Item registry** and world item drop/pickup
- **Health system** with damage cooldowns and game-over callbacks
- **Map transitions** with position locking and camera snap
- **SNES-style notifications** with themes and stacking
- **Animation counters** and prop collision generation

## Quick Start

```html
<script type="module">
import {
  initCanvas, player, createGameLoop, initInput, updateCamera,
  renderWorld, setCurrentMap, setMap, setGameStarted,
  handleMovement, isSolid
} from './engine/index.js';

// Setup canvas
const canvas = document.getElementById('gameCanvas');
initCanvas(canvas);

// Configure player
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
const solidTiles = [2];
setCurrentMap('level1');
setMap(myMap);

// Initialize input
initInput();

// Tile rendering callback
function drawTile(ctx, x, y, tileId) {
  const colors = { 0: '#7cb342', 2: '#5d4037' };
  ctx.fillStyle = colors[tileId] || '#000';
  ctx.fillRect(x, y, 16, 16);
}

// Game loop with delta-time
const loop = createGameLoop({
  update: (dt) => {
    updateCamera({ target: player, tileSize: 16, mapWidth: 5, mapHeight: 4 });
    handleMovement(player, {
      speed: 0.4,
      dt,
      collisionOpts: { map: myMap, solidTiles },
    });
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
| `state.js` | Centralized game state (player, map, flags) |
| `game-loop.js` | Fixed-timestep game loop with delta-time support |
| `input.js` | Keyboard input tracking with configurable bindings |
| `bindings.js` | Default key bindings (WASD/arrows, Escape, Space) |
| `camera.js` | Smooth-follow camera with bounds clamping |
| `collision.js` | Tile + entity + prop collision detection |
| `movement.js` | Player movement with diagonal normalization and collision |
| `renderer.js` | Y-sorted rendering pipeline with sprite registry |
| `detection.js` | Entity/prop facing and proximity detection |
| `interactions.js` | Priority-based interaction dispatch |
| `dialogue.js` | Multi-line dialogue with choices and callbacks |
| `entities.js` | NPC and enemy management with patrol AI |
| `inventory.js` | Two-hand inventory with backpack storage |
| `items.js` | Item type registry and world item management |
| `props.js` | Prop collision tile generation |
| `health.js` | Damage/healing with cooldowns and game-over |
| `notifications.js` | SNES-style floating messages with themes |
| `transitions.js` | Map enter/exit with position locking |
| `animation.js` | Rate-limited animation frame counters |
| `events.js` | Pub/sub event bus for inter-module communication |
| `index.js` | Main entry point — re-exports all modules |

## Event System

The engine emits events you can subscribe to:

```js
import { engine } from './engine/index.js';

engine.on('player-died', () => showGameOver());
engine.on('item-acquired', (item) => playSound('pickup'));
engine.on('map-changed', ({ mapName }) => loadAssets(mapName));
engine.on('dialogue-start', ({ speaker }) => lockPlayer());
```

**Available events:** `player-died`, `health-changed`, `item-acquired`, `item-removed`, `map-changed`, `dialogue-start`, `dialogue-line`, `dialogue-choices`, `dialogue-close`, `interact`, `pause-toggle`, `enemy-collision`, `world-item-added`, `world-item-picked`, `world-item-removed`, `interaction-handled`, `interaction-none`, `prompt-show`, `prompt-hide`

## Delta-Time Movement

The game loop passes a `deltaFactor` to `update()`:

```js
const loop = createGameLoop({
  update: (dt) => {
    // dt = 1.0 at target FPS, >1.0 on lag, <1.0 on fast frames
    handleMovement(player, { speed: 0.4, dt });
    entityMgr.updateEnemies('forest', isSolid, dt);
  },
  // ...
});
```

## Configurable Bindings

Override default WASD/arrow keys:

```js
import { DEFAULT_BINDINGS, initInput } from './engine/index.js';

const customBindings = {
  ...DEFAULT_BINDINGS,
  moveUp: ['i', 'pageup'],
  moveDown: ['k', 'pagedown'],
  pause: ['escape', 'tab'],
};

initInput({ bindings: customBindings });
```

## Design Philosophy

- **No globals** — everything is imported/exported
- **No opinions** — the engine provides systems, you wire them together
- **Configurable** — pass callbacks and data, don't inherit from base classes
- **Tiny** — ~900 lines total, zero dependencies
- **Tested** — 334 tests covering all modules

## Testing

```bash
npm install
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## License

MIT
