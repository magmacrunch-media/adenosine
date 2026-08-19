# Adenosine

A collection of lightweight web game engines by [MagmaCrunch](https://magmacrunch.com). TypeScript and JavaScript, zero runtime dependencies, built for browsers.

## Packages

| Package | Description |
|---------|-------------|
| [`@magmacrunch/adenosine-rpg`](packages/rpg/) | 2D tile-based RPG engine — game loop, movement, camera, dialogue, inventory, and more |
| [`@magmacrunch/adenosine-puzzle`](packages/puzzle/) | Sliding tile puzzle framework — grid engine, input, rendering, scoring |
| [`@magmacrunch/adenosine-cards`](packages/cards/) | Card deck, pixel-art SVG rendering, and poker chip animations |
| [`@magmacrunch/adenosine-audio`](packages/audio/) | Web Audio engine for looping music and pooled sound effects |
| [`@magmacrunch/adenosine-score-client`](packages/score-client/) | WebSocket high score client with localStorage fallback and offline queue |
| [`@magmacrunch/adenosine-multiplayer`](packages/multiplayer/) | Game-agnostic multiplayer WebSocket client with lobby, chat, and room management |
| [`@magmacrunch/adenosine-chat`](packages/chat/) | Floating real-time chat widget with SharedWorker WebSocket persistence |

## Quick Start

### RPG Engine

```bash
npm install @magmacrunch/adenosine-rpg
```

```js
import {
  initCanvas, player, createGameLoop, initInput, updateCamera,
  renderWorld, setCurrentMap, setMap, setGameStarted,
  handleMovement, isSolid
} from '@magmacrunch/adenosine-rpg';

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

### Puzzle Framework

```bash
npm install @magmacrunch/adenosine-puzzle
```

```js
import { PuzzleGrid, createGame, createInput, createRenderer, createScoring } from '@magmacrunch/adenosine-puzzle';

const board = document.getElementById('board');
const renderer = createRenderer(board);
const scoring = createScoring('fifteen-puzzle');

const game = createGame({ size: 4, gameName: 'fifteen-puzzle', spawnTiles: false });

game.addRandomTile = () => {
  const empty = PuzzleGrid.getEmptyCells(game.grid);
  if (empty.length === 0) return;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  game.grid.board[cell.row][cell.col] = Math.random() < 0.9 ? 1 : 2;
};

game.moveLeft = () => {
  // Implement sliding tile merge logic here
};

game.setOnRender(() => renderer.renderGrid(game.grid));
game.setOnStateChange((info) => {
  document.getElementById('score').textContent = info.score;
});

const input = createInput({
  onMove: (dir) => game.handleMove(dir),
  isActive: () => game.isActive(),
}, board);

game.init();
```

### Cards

```bash
npm install @magmacrunch/adenosine-cards
```

```js
import { Card, Deck } from '@magmacrunch/adenosine-cards';
import '@magmacrunch/adenosine-cards/cards.css';

const deck = new Deck();
deck.shuffle();

const card = deck.deal();
card.flip();
document.getElementById('hand').appendChild(card.getHTML());
```

### Score Client

```bash
npm install @magmacrunch/adenosine-score-client
```

```js
import { ScoreClient } from '@magmacrunch/adenosine-score-client';

const client = new ScoreClient().auto();

// Load scores
const scores = await client.load('tetris');

// Save a score
const { rank, synced } = await client.save('tetris', 'JAM', 12400, { level: 5 });
console.log(`Rank: #${rank} (synced: ${synced})`);
```

### Audio

```bash
npm install @magmacrunch/adenosine-audio
```

```js
import * as AdAudio from '@magmacrunch/adenosine-audio';

// Load a music track and a set of sound effects up front
await AdAudio.init({
  music: { url: 'audio/theme.ogg', volume: 0.4, fadeIn: 2.0 },
  sfx: {
    deal: { url: 'audio/deal.wav', volume: 0.8, pool: 4 },
    win:  { url: 'audio/win.wav' },
  },
});

// Browsers require a user gesture before audio can start
playButton.addEventListener('click', () => AdAudio.playMusic());

AdAudio.playSfx('deal');
AdAudio.toggleMusicMute();

// Pause music while the tab is hidden
AdAudio.handleVisibility(true);
```

### Multiplayer

```bash
npm install @magmacrunch/adenosine-multiplayer
```

```js
import { MP, MSG, BoardGameTemplate } from '@magmacrunch/adenosine-multiplayer';

// Generate board game HTML (returns markup — it does not insert it)
const html = BoardGameTemplate.render({
  title: 'CHESS',
  credits: '<h3>Chess</h3><p>Your name here</p>',
});

// Point the client at your server. With nothing configured it targets the
// origin that served the page.
MP.configure({
  defaultServer: 'games.example.com/chess',
  allowlist: ['games.example.com'],
});

MP.onWelcome = (data) => console.log('Joined room:', data.room);
MP.onGameStarted = (data) => startGame(data);
MP.onGameAction = (action) => handleAction(action);

MP.connect();
MP.join('Player1', '#ff2d55');
```

### Chat Widget

```bash
npm install @magmacrunch/adenosine-chat
```

```html
<link rel="stylesheet" href="@magmacrunch/adenosine-chat/chat-widget.css">
<script type="module">
  import { ChatWidget } from '@magmacrunch/adenosine-chat';
  ChatWidget.connect();
</script>
```

## Origin

Adenosine packages are extracted from the [magmacrunch.com](https://magmacrunch.com) arcade shared code. The original games remain in the website repo; these packages are the standalone, reusable versions.

## Development

This is a monorepo using npm workspaces.

```bash
npm install                        # install all dependencies
npm test                           # run all tests across packages
npm run build                      # build all packages (ESM + IIFE)
npm run typecheck                  # typecheck all packages

# Single package
cd packages/rpg
npm test
npm run build
```

## Script Tag (no bundler)

Each package builds an IIFE bundle alongside ESM for direct `<script>` tag usage:

```html
<script src="path/to/adenosine-rpg.js"></script>
<script>
  const loop = AdRPG.createGameLoop({ update, render, fps: 30 });
  loop.start();
</script>
```

| Package | Global | Description |
|---------|--------|-------------|
| `@magmacrunch/adenosine-rpg` | `window.AdRPG` | Game loop, input, state, camera, collision, entities |
| `@magmacrunch/adenosine-score-client` | `window.AdScore` | WebSocket high score client |
| `@magmacrunch/adenosine-puzzle` | `window.AdPuzzle` | Sliding tile puzzle framework |
| `@magmacrunch/adenosine-cards` | `window.AdCards` | Card deck, pixel-art rendering, chips |
| `@magmacrunch/adenosine-audio` | `window.AdAudio` | Web Audio music and sound effects |
| `@magmacrunch/adenosine-chat` | `window.AdChat` | Floating real-time chat widget |
| `@magmacrunch/adenosine-multiplayer` | `window.AdMP` | Multiplayer WebSocket client |

IIFE files are generated by tsup (`format: ['esm', 'iife']`) and live in `packages/*/dist/index.global.js`.

## Design Philosophy

- **Dual format** — ESM for bundlers, IIFE for script tags (globals: `AdRPG`, `AdScore`, etc.)
- **No opinions** — engines provide systems, you wire them together
- **Configurable** — pass callbacks and data, don't inherit from base classes
- **Tiny** — small, focused modules with zero runtime dependencies
- **Tested** — comprehensive test coverage across all packages

## License

[Apache-2.0](LICENSE). Copyright 2026 Magma Crunch Media.

You may use adenosine in your own projects, commercial ones included. The
license asks that you keep the `NOTICE` file with any copy you distribute, which
is how credit for adenosine travels with it.
