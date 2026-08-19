# @magmacrunch/adenosine-rpg

Lightweight 2D tile-based RPG engine — game loop, movement, camera, collision,
dialogue, inventory and entities. No runtime dependencies.

```bash
npm install @magmacrunch/adenosine-rpg
```

## Use

```js
import {
  initCanvas, player, createGameLoop, initInput,
  updateCamera, renderWorld, setCurrentMap, setMap,
  setGameStarted, handleMovement,
} from '@magmacrunch/adenosine-rpg';

initCanvas(document.getElementById('gameCanvas'));
player.x = 10;
player.y = 10;

const map = [
  [2,2,2,2,2],
  [2,0,0,0,2],
  [2,0,0,0,2],
  [2,2,2,2,2],
];
setCurrentMap('level1');
setMap(map);
initInput();

const loop = createGameLoop({
  update: (dt) => {
    updateCamera({ target: player, tileSize: 16, mapWidth: 5, mapHeight: 4 });
    handleMovement(player, { speed: 0.4, dt, collisionOpts: { map, solidTiles: [2] } });
  },
  render: () => renderWorld({
    map, tileSize: 16,
    renderTile: (ctx, x, y, id) => {
      ctx.fillStyle = { 0: '#7cb342', 2: '#5d4037' }[id] || '#000';
      ctx.fillRect(x, y, 16, 16);
    },
    layers: [{ sortY: player.y, render: (ctx) => { /* draw player */ } }],
  }),
  fps: 30,
});

setGameStarted(true);
loop.start();
```

[`API.md`](API.md) documents every export, with parameters and return shapes.

## Without a bundler

```html
<script src="adenosine-rpg.js"></script>
<script>
  const loop = AdRPG.createGameLoop({ update, render, fps: 30 });
  loop.start();
</script>
```

The IIFE build is `dist/index.global.js` and exposes `window.AdRPG`.

## Note

State lives in module-level singletons, so one page runs one RPG. That suits the
game it was extracted from; a second concurrent instance would need the state
module reworked.

## License

[Apache-2.0](LICENSE) — Copyright 2026 Magma Crunch Media.

Part of [adenosine](https://github.com/magmacrunchmedia/adenosine), a collection
of lightweight web game engines by [magmacrunch media](https://magmacrunch.com).
Keep the `NOTICE` file with any copy you distribute.
