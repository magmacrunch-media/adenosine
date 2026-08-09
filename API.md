# API Reference

Complete API reference for all Magma Engine modules.

## Table of Contents

- [state.js](#statejs) — Game state
- [game-loop.js](#game-loopjs) — Game loop
- [input.js](#inputjs) — Keyboard input
- [bindings.js](#bindingsjs) — Key bindings
- [camera.js](#camerajs) — Camera system
- [collision.js](#collisionjs) — Collision detection
- [movement.js](#movementjs) — Player movement
- [renderer.js](#rendererjs) — Rendering pipeline
- [detection.js](#detectionjs) — Entity/prop detection
- [interactions.js](#interactionsjs) — Interaction dispatch
- [dialogue.js](#dialoguejs) — Dialogue system
- [entities.js](#entitiesjs) — NPC/enemy management
- [inventory.js](#inventoryjs) — Inventory system
- [items.js](#itemsjs) — Item registry & world items
- [props.js](#propsjs) — Prop collision generation
- [health.js](#healthjs) — Health system
- [notifications.js](#notificationsjs) — Notifications
- [transitions.js](#transitionsjs) — Map transitions
- [animation.js](#animationjs) — Animation counters
- [events.js](#eventsjs) — Event bus
- [Events Catalog](#events-catalog)

---

## state.js

Centralized game state — the single source of truth for all engine modules.

### State Variables

| Export | Type | Default | Description |
|--------|------|---------|-------------|
| `player` | `object` | `{ x:0, y:0, facingX:0, facingY:1, direction:'down', isWalking:false, health:100, maxHealth:100, positionLocked:false }` | Player state |
| `gameStarted` | `boolean` | `false` | Whether the game has begun |
| `gamePaused` | `boolean` | `false` | Whether the game is paused |
| `gameOver` | `boolean` | `false` | Whether the game is over |
| `currentMap` | `string` | `'default'` | Active map name |
| `map` | `number[][]\|null` | `null` | Active 2D tile array |
| `canvas` | `HTMLCanvasElement\|null` | `null` | Game canvas |
| `ctx` | `CanvasRenderingContext2D\|null` | `null` | 2D drawing context |
| `transitionCooldown` | `number` | `0` | Map transition cooldown |
| `animationFrame` | `number` | `0` | General animation frame |
| `frameCounter` | `number` | `0` | General frame counter |
| `waterAnimFrame` | `number` | `0` | Water animation frame |
| `waterAnimCounter` | `number` | `0` | Water animation counter |
| `campfireAnimFrame` | `number` | `0` | Campfire animation frame |
| `campfireAnimCounter` | `number` | `0` | Campfire animation counter |

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `initCanvas` | `(canvasEl: HTMLCanvasElement)` | Set the game canvas and obtain 2D context |
| `setGameStarted` | `(val: boolean)` | Set gameStarted |
| `setGamePaused` | `(val: boolean)` | Set gamePaused |
| `setGameOver` | `(val: boolean)` | Set gameOver |
| `setCurrentMap` | `(val: string)` | Set currentMap |
| `setMap` | `(val: number[][])` | Set map |
| `setTransitionCooldown` | `(val: number)` | Set transitionCooldown |

---

## game-loop.js

Fixed-timestep game loop with FPS limiting via `requestAnimationFrame`.

### `createGameLoop({ update, render, fps })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `update` | `(dt: number) => void` | `undefined` | Called each tick with delta factor (1.0 = on time) |
| `render` | `() => void` | `undefined` | Called each tick to draw |
| `fps` | `number` | `30` | Target frames per second |

**Returns:** `{ start, stop }`

| Method | Description |
|--------|-------------|
| `start()` | Begin the animation frame loop |
| `stop()` | Cancel the loop and reset timing state |

**Behavior:** Skips `update` when `gamePaused` or `gameOver`. Skips `render` when `gameStarted` is false or `gameOver`. Clears canvas before each render.

---

## input.js

Keyboard input handling — tracks held keys and one-shot key presses.

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `keys` | `Record<string, boolean>` | Currently held keys |
| `keysPressed` | `Record<string, boolean>` | One-shot key presses |

### `initInput({ onPause, onInteract, bindings })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `onPause` | `() => void` | `undefined` | Called on pause key |
| `onInteract` | `() => void` | `undefined` | Called on interact key |
| `bindings` | `object` | `DEFAULT_BINDINGS` | Key binding config |

**Returns:** `{ destroy }` — removes event listeners

**Events emitted:** `pause-toggle`, `interact`

---

## bindings.js

Default key bindings for input and movement.

### `DEFAULT_BINDINGS`

```js
{
  moveUp:    ['arrowup', 'w'],
  moveDown:  ['arrowdown', 's'],
  moveLeft:  ['arrowleft', 'a'],
  moveRight: ['arrowright', 'd'],
  pause:     ['escape', 'p'],
  interact:  [' '],
}
```

---

## camera.js

Smooth-follow camera with bounds clamping.

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `camera` | `{ x: number, y: number }` | Current camera position in pixels |

### `updateCamera({ target, tileSize, mapWidth, mapHeight, smoothing })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `target` | `{ x, y }` | (required) | Tile-space position to follow |
| `tileSize` | `number` | (required) | Tile size in pixels |
| `mapWidth` | `number` | (required) | Map width in tiles |
| `mapHeight` | `number` | (required) | Map height in tiles |
| `smoothing` | `number` | `0.3` | Lerp factor (0 = no follow, 1 = instant) |

---

## collision.js

Tile-based + entity + prop collision detection.

### `isSolid(x, y, { map, solidTiles, entities, props })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `x` | `number` | (required) | Tile X (can be fractional) |
| `y` | `number` | (required) | Tile Y (can be fractional) |
| `map` | `number[][]` | `undefined` | 2D tile array |
| `solidTiles` | `number[]` | `[]` | Solid tile IDs |
| `entities` | `Array` | `[]` | Entities to check (distance-based) |
| `props` | `Array<{x,y}>` | `[]` | Solid prop positions (exact tile) |

**Returns:** `boolean` — true if position is impassable

---

## movement.js

Tile-based player movement with diagonal normalization and collision.

### `handleMovement(player, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `object` | (required) | Player object (mutated in place) |
| `opts.speed` | `number` | `0.4` | Movement speed in tiles/frame |
| `opts.dt` | `number` | `1` | Delta time factor |
| `opts.isBlocked` | `() => boolean` | `undefined` | Additional blocking check |
| `opts.collisionOpts` | `object` | `{}` | Options for `isSolid` |
| `opts.bindings` | `object` | `DEFAULT_BINDINGS` | Key bindings |

**Returns:** `boolean` — whether the player moved

**Mutates:** `player.x`, `player.y`, `player.facingX`, `player.facingY`, `player.direction`, `player.isWalking`

---

## renderer.js

Y-sorted rendering pipeline with sprite registry.

### `renderWorld({ map, tileSize, renderTile, layers, background })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `map` | `number[][]` | (required) | 2D tile array |
| `tileSize` | `number` | (required) | Tile size in pixels |
| `renderTile` | `(ctx, screenX, screenY, tileId, tileX, tileY) => void` | (required) | Tile draw callback |
| `layers` | `Array<{ sortY, render }>` | `[]` | Y-sorted entity layers |
| `background` | `(ctx) => void` | `undefined` | Drawn first (parallax, sky) |

### `tileToScreen(tileX, tileY, tileSize)`

**Returns:** `{ x, y }` — screen pixel coordinates

### `createSpriteRegistry()`

**Returns:** `{ register, draw }`

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(type: string, drawFn: Function)` | Register a sprite draw function |
| `draw` | `(type: string, ...args)` | Draw a registered sprite (magenta fallback if unregistered) |

---

## detection.js

Entity and prop detection helpers for interaction systems.

### `getEntityInFront(player, entities, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `{ x, y, facingX, facingY }` | (required) | Player object |
| `entities` | `Array` | (required) | Entities to search |
| `opts.map` | `string` | `undefined` | Filter by map name |
| `opts.threshold` | `number` | `0.8` | Squared distance threshold |
| `opts.filter` | `(entity) => boolean` | `undefined` | Custom filter |

**Returns:** `object|null` — first matching entity

### `isFacingProp(player, prop)`

**Returns:** `boolean` — whether player faces the prop (supports multi-tile)

### `isNearProp(player, prop, threshold?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `{ x, y }` | (required) | Player object |
| `prop` | `{ x, y, width?, height? }` | (required) | Prop object |
| `threshold` | `number` | `2.0` | Max Manhattan distance |

**Returns:** `boolean`

---

## interactions.js

Priority-based interaction dispatch system.

### `createInteractionManager()`

**Returns:** `{ register, unregister, handleInteraction, updatePrompt, getPrompt, getSources }`

### `register({ name, priority, handler, promptFn })`

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Source identifier |
| `priority` | `number` | Higher = checked first |
| `handler` | `(player, context) => boolean` | Return true if handled |
| `promptFn` | `(player, context) => string\|null` | Return prompt text |

### `handleInteraction(player, context?)`

Dispatches to highest-priority handler. **Returns:** `boolean`

### `updatePrompt(player, context?)`

Updates the current prompt (call each frame).

### `getPrompt()`

**Returns:** `string|null` — current prompt text

**Events emitted:** `interaction-handled`, `interaction-none`, `prompt-show`, `prompt-hide`

---

## dialogue.js

Dialogue system with multi-line text, choices, and close callbacks.

### `createDialogueSystem()`

**Returns:** `{ show, advance, moveChoice, selectChoice, close, isActive, getState }`

### `show(speakerData, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `speakerData` | `{ dialogue: string\|string[] }` | (required) | Speaker with dialogue lines |
| `opts.choices` | `Array<{ label?, callback? }>` | `[]` | Choice options |
| `opts.onClose` | `() => void` | `null` | Close callback |

### `advance()`

Advance to next line, or show choices if at end.

### `moveChoice(dir)`

Move choice cursor by `dir` (+1 or -1). Wraps around.

### `selectChoice()`

Confirm current choice, close dialogue, call choice callback.

### `close()`

Close dialogue and invoke `onClose` callback.

### `isActive()`

**Returns:** `boolean`

### `getState()`

**Returns:** `{ active, speaker, lines, lineIndex, currentLine, choices, choiceIndex, choicesMade, hasMoreLines, showChoices }`

**Events emitted:** `dialogue-start`, `dialogue-line`, `dialogue-choices`, `dialogue-close`

---

## entities.js

NPC and enemy entity management with patrol AI.

### `createEntityManager()`

**Returns:** `{ addNPC, addEnemy, getNPCs, getEnemies, updateEnemies, checkEnemyCollisions, getNPCInFront }`

### `addNPC(data)`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `x`, `y` | `number` | (required) | Tile position |
| `name` | `string` | `''` | Display name |
| `type` | `string` | `'npc'` | Entity type |
| `map` | `string` | `'default'` | Map name |
| `direction` | `string` | `'down'` | Facing direction |
| `dialogue` | `string[]` | `[]` | Dialogue lines |

### `addEnemy(data)`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `x`, `y` | `number` | (required) | Tile position |
| `map` | `string` | `'default'` | Map name |
| `moveSpeed` | `number` | `60` | Ticks between moves |
| `patrolRange` | `number` | `5` | Max tiles from start |
| `damage` | `number` | `10` | Damage on contact |

### `updateEnemies(mapName, isSolidFn, dt?)`

Run patrol AI for enemies on a map. `dt` defaults to 1.

### `checkEnemyCollisions(playerX, playerY, mapName, damageCallback)`

**Returns:** `Enemy|null` — the colliding enemy, or null

### `getNPCInFront(player, mapName, threshold?)`

**Returns:** `NPC|null` — NPC at the player's facing tile

**Events emitted:** `enemy-collision`

---

## inventory.js

Two-hand inventory with backpack storage.

### `createInventory()`

**Returns:** Inventory object with:

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `addItem` | `(item)` | `boolean` | Add to first empty hand |
| `removeItem` | `(itemId)` | `object\|null` | Remove by type ID |
| `getItem` | `(itemId)` | `object\|null` | Get by type ID |
| `hasItem` | `(itemId)` | `boolean` | Check if equipped |
| `swapHands` | `()` | `void` | Swap left/right |
| `isFull` | `()` | `boolean` | Both hands occupied |
| `equipBackpack` | `(type)` | `void` | Equip backpack (sets storage capacity) |
| `unequipBackpack` | `()` | `object\|null` | Unequip and return type |
| `addToStorage` | `(itemId)` | `boolean` | Add to backpack storage |
| `removeFromStorage` | `(itemId)` | `string\|null` | Remove from storage |
| `clear` | `()` | `void` | Reset everything |

**Events emitted:** `item-acquired`, `item-removed`

---

## items.js

Item type registry and world item management.

### `createItemRegistry()`

**Returns:** `{ register, get, isQuest, canDrop, canStore, all }`

### `createWorldItems()`

**Returns:** `{ addItem, getItems, checkPickup, pickup, remove, clear }`

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `addItem` | `(mapName, itemId, x, y)` | `{ itemId, x, y }` | Place item on ground |
| `getItems` | `(mapName)` | `Array` | Get items on map |
| `checkPickup` | `(px, py, map, radius?)` | `object\|null` | Find nearby item |
| `pickup` | `(item, inventory)` | `boolean` | Pick up into inventory |
| `remove` | `(item)` | `boolean` | Remove from world |
| `clear` | `(mapName)` | `void` | Clear all items on map |

**Events emitted:** `world-item-added`, `world-item-picked`, `world-item-removed`

---

## props.js

Prop collision tile generation.

### `generatePropCollisionTiles(props)`

| Param | Type | Description |
|-------|------|-------------|
| `props` | `Array` | Prop definitions with `x`, `y`, and either `solidTiles` or `collidable` |

**Returns:** `Array<{ x, y }>` — flat collision tile positions

---

## health.js

Health system with damage/healing and game-over callback.

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `damagePlayer` | `(amount: number)` | Deal damage (clamped to 0, ignores negative) |
| `healPlayer` | `(amount: number)` | Heal (clamped to maxHealth, ignores negative) |
| `setOnGameOverCallback` | `(fn: () => void)` | Set death callback |
| `createDamageCooldown` | `(frames?: number)` | Create invincibility timer (default 60 frames) |

### `createDamageCooldown(frames?)` Returns:

| Method | Description |
|--------|-------------|
| `canDamage()` | `boolean` — whether player can take damage |
| `recordHit()` | Start cooldown |
| `tick()` | Decrement cooldown each frame |

**Events emitted:** `health-changed`, `player-died`

---

## notifications.js

SNES-style floating notification system.

### `showNotification(text, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | `string` | (required) | Notification text |
| `opts.duration` | `number` | `2000` | Display time (ms) |
| `opts.theme` | `string` | `'default'` | `'default'`/`'locked'`/`'item'` |
| `opts.container` | `HTMLElement` | `document.body` | Parent element |

**Returns:** `{ cancel }` — remove notification early

---

## transitions.js

Map transition system with position locking.

### `transitionTo({ mapName, maps, x, y, facing?, tileSize? })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mapName` | `string` | (required) | Target map key |
| `maps` | `Record<string, number[][]>` | (required) | Maps registry |
| `x`, `y` | `number` | (required) | Spawn position |
| `facing` | `string` | `undefined` | Player facing after transition |
| `tileSize` | `number` | `16` | Tile size for camera snap |

**Events emitted:** `map-changed`

---

## animation.js

Rate-limited animation frame counter.

### `createAnimationCounter({ frames, interval })`

| Param | Type | Description |
|-------|------|-------------|
| `frames` | `number` | Number of frames in cycle |
| `interval` | `number` | Ticks between frame advances |

**Returns:** `{ update, frame, reset }`

| Method | Returns | Description |
|--------|---------|-------------|
| `update()` | `number` | Advance counter, return current frame |
| `frame` | `number` | Current frame (getter) |
| `reset()` | `void` | Reset to frame 0 |

---

## events.js

Minimal pub/sub event bus.

### `createEventBus()`

**Returns:** `{ on, once, off, emit }`

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `on` | `(event, fn)` | `() => void` | Subscribe (returns unsubscribe fn) |
| `once` | `(event, fn)` | `() => void` | Subscribe once |
| `off` | `(event, fn)` | `void` | Unsubscribe |
| `emit` | `(event, data)` | `void` | Emit event |

### `engine`

Singleton event bus shared by the entire engine.

---

## Events Catalog

| Event | Payload | Source | Trigger |
|-------|---------|--------|---------|
| `player-died` | `{ health }` | health.js | Health reaches 0 |
| `health-changed` | `{ health, maxHealth }` | health.js | After damage or heal |
| `item-acquired` | `item` | inventory.js | Item added to hand |
| `item-removed` | `item` | inventory.js | Item removed from hand |
| `map-changed` | `{ mapName, map }` | transitions.js | After map transition |
| `dialogue-start` | `{ speaker, line }` | dialogue.js | Dialogue begins |
| `dialogue-line` | `{ speaker, line }` | dialogue.js | Line advances |
| `dialogue-choices` | `{ choices }` | dialogue.js | Choices displayed |
| `dialogue-close` | — | dialogue.js | Dialogue closed |
| `interact` | — | input.js | Space key pressed |
| `pause-toggle` | — | input.js | Pause key pressed |
| `enemy-collision` | `{ enemy }` | entities.js | Player touches enemy |
| `world-item-added` | `{ mapName, item }` | items.js | Item placed on ground |
| `world-item-picked` | `{ item }` | items.js | Item picked up |
| `world-item-removed` | `{ mapName, item }` | items.js | Item removed from world |
| `interaction-handled` | `{ source, player }` | interactions.js | Source handled interaction |
| `interaction-none` | `{ player }` | interactions.js | No source handled |
| `prompt-show` | `{ text, source }` | interactions.js | Prompt displayed |
| `prompt-hide` | — | interactions.js | Prompt removed |
