# Adenosine

A collection of lightweight web game engines by [MagmaCrunch](https://magmacrunch.com). TypeScript and JavaScript, zero runtime dependencies, built for browsers.

## Packages

| Package | Description |
|---------|-------------|
| [`@adenosine/rpg`](packages/rpg/) | 2D tile-based RPG engine — game loop, movement, camera, dialogue, inventory, and more |
| `@adenosine/puzzle` | Sliding tile puzzle framework — grid engine, input, rendering, scoring |
| `@adenosine/cards` | Card deck, pixel-art SVG rendering, and poker chip animations |
| `@adenosine/score-client` | WebSocket high score client with localStorage fallback and offline queue |
| `@adenosine/multiplayer` | Game-agnostic multiplayer WebSocket client with lobby, chat, and room management |
| `@adenosine/chat` | Floating real-time chat widget with SharedWorker WebSocket persistence |

## Quick Start

```bash
npm install @adenosine/rpg
```

```js
import {
  initCanvas, player, createGameLoop, initInput, updateCamera,
  renderWorld, setCurrentMap, setMap, setGameStarted,
  handleMovement, isSolid
} from '@adenosine/rpg';

const canvas = document.getElementById('gameCanvas');
initCanvas(canvas);

player.x = 10;
player.y = 10;

const myMap = [
  [2,2,2,2,2],
  [2,0,0,0,2],
  [2,0,0,0,2],
  [2,2,2,2,2],
];
setCurrentMap('level1');
setMap(myMap);
initInput();

function drawTile(ctx, x, y, tileId) {
  const colors = { 0: '#7cb342', 2: '#5d4037' };
  ctx.fillStyle = colors[tileId] || '#000';
  ctx.fillRect(x, y, 16, 16);
}

const loop = createGameLoop({
  update: (dt) => {
    updateCamera({ target: player, tileSize: 16, mapWidth: 5, mapHeight: 4 });
    handleMovement(player, {
      speed: 0.4,
      dt,
      collisionOpts: { map: myMap, solidTiles: [2] },
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

setGameStarted(true);
loop.start();
```

## Development

This is a monorepo using npm workspaces.

```bash
npm install                        # install all dependencies
npm test                           # run all tests across packages
npm run build                      # build all packages
npm run typecheck                  # typecheck all packages

# Single package
cd packages/rpg
npm test
npm run build
```

## Design Philosophy

- **No globals** — everything is imported/exported
- **No opinions** — engines provide systems, you wire them together
- **Configurable** — pass callbacks and data, don't inherit from base classes
- **Tiny** — small, focused modules with zero runtime dependencies
- **Tested** — comprehensive test coverage across all packages

## License

LGPL-2.1
