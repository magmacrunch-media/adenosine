# API Reference

Complete API reference for all Adenosine modules.

## Table of Contents

- [state.ts](#statets) — Game state
- [game-loop.ts](#game-loopts) — Game loop
- [input.ts](#inputts) — Keyboard input
- [bindings.ts](#bindingsts) — Key bindings
- [camera.ts](#camerats) — Camera system
- [collision.ts](#collisionts) — Collision detection
- [movement.ts](#movementts) — Player movement
- [renderer.ts](#rendererts) — Rendering pipeline
- [detection.ts](#detectionts) — Entity/prop detection
- [interactions.ts](#interactionsts) — Interaction dispatch
- [dialogue.ts](#dialoguets) — Dialogue system
- [entities.ts](#entitiests) — NPC/enemy management
- [inventory.ts](#inventoryts) — Inventory system
- [items.ts](#itemsts) — Item registry & world items
- [props.ts](#propsts) — Prop collision generation
- [health.ts](#healthts) — Health system
- [notifications.ts](#notificationsts) — Notifications
- [transitions.ts](#transitionsts) — Map transitions
- [animation.ts](#animationts) — Animation counters
- [events.ts](#eventsts) — Event bus
- [Events Catalog](#events-catalog)

---

## state.ts

Centralized game state — the single source of truth for all engine modules.

### State Variables

| Export | Type | Default | Description |
|--------|------|---------|-------------|
| `player` | `Player` | `{ x:0, y:0, facingX:0, facingY:1, direction:'down', isWalking:false, health:100, maxHealth:100, positionLocked:false }` | Player state |
| `gameStarted` | `boolean` | `false` | Whether the game has begun |
| `gamePaused` | `boolean` | `false` | Whether the game is paused |
| `gameOver` | `boolean` | `false` | Whether the game is over |
| `currentMap` | `string` | `'default'` | Active map name |
| `map` | `number[][]` | `[]` | Active 2D tile array |
| `canvas` | `HTMLCanvasElement \| null` | `null` | Game canvas |
| `ctx` | `CanvasRenderingContext2D \| null` | `null` | 2D drawing context |
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
| `initCanvas` | `(canvasEl: HTMLCanvasElement) => void` | Set the game canvas and obtain 2D context |
| `setGameStarted` | `(val: boolean) => void` | Set gameStarted |
| `setGamePaused` | `(val: boolean) => void` | Set gamePaused |
| `setGameOver` | `(val: boolean) => void` | Set gameOver |
| `setCurrentMap` | `(val: string) => void` | Set currentMap |
| `setMap` | `(val: number[][]) => void` | Set map |
| `setTransitionCooldown` | `(val: number) => void` | Set transitionCooldown |

---

## game-loop.ts

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

## input.ts

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
| `bindings` | `KeyBindings` | `DEFAULT_BINDINGS` | Key binding config |

**Returns:** `{ destroy }` — removes event listeners

**Events emitted:** `pause-toggle`, `interact`

---

## bindings.ts

Default key bindings for input and movement.

### `DEFAULT_BINDINGS`

```ts
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

## camera.ts

Smooth-follow camera with bounds clamping.

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `camera` | `Camera` (`{ x: number, y: number }`) | Current camera position in pixels |

### `updateCamera({ target, tileSize, mapWidth, mapHeight, smoothing })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `target` | `{ x: number, y: number }` | `undefined` | Tile-space position to follow |
| `tileSize` | `number` | `undefined` | Tile size in pixels |
| `mapWidth` | `number` | `undefined` | Map width in tiles |
| `mapHeight` | `number` | `undefined` | Map height in tiles |
| `smoothing` | `number` | `0.3` | Lerp factor (0 = no follow, 1 = instant) |

---

## collision.ts

Tile-based + entity + prop collision detection.

### `isSolid(x, y, { map, solidTiles, entities, props })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `x` | `number` | (required) | Tile X (can be fractional) |
| `y` | `number` | (required) | Tile Y (can be fractional) |
| `map` | `number[][]` | `undefined` | 2D tile array |
| `solidTiles` | `number[]` | `[]` | Solid tile IDs |
| `entities` | `Entity[]` | `[]` | Entities to check (distance-based) |
| `props` | `PropCollisionTile[]` | `[]` | Solid prop positions (exact tile) |

**Returns:** `boolean` — true if position is impassable

---

## movement.ts

Tile-based player movement with diagonal normalization and collision.

### `handleMovement(player, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `Player` | (required) | Player object (mutated in place) |
| `opts.speed` | `number` | `0.4` | Movement speed in tiles/frame |
| `opts.dt` | `number` | `1` | Delta time factor |
| `opts.isBlocked` | `() => boolean` | `undefined` | Additional blocking check |
| `opts.collisionOpts` | `CollisionOptions` | `{}` | Options for `isSolid` |
| `opts.bindings` | `KeyBindings` | `DEFAULT_BINDINGS` | Key bindings |

**Returns:** `boolean` — whether the player moved

**Mutates:** `player.x`, `player.y`, `player.facingX`, `player.facingY`, `player.direction`, `player.isWalking`

---

## renderer.ts

Y-sorted rendering pipeline with sprite registry.

### `renderWorld({ map, tileSize, renderTile, layers, background })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `map` | `number[][]` | (required) | 2D tile array |
| `tileSize` | `number` | (required) | Tile size in pixels |
| `renderTile` | `(ctx, screenX, screenY, tileId, tileX, tileY) => void` | (required) | Tile draw callback |
| `layers` | `RenderLayer[]` | `[]` | Y-sorted entity layers |
| `background` | `(ctx: CanvasRenderingContext2D) => void` | `undefined` | Drawn first (parallax, sky) |

### `tileToScreen(tileX, tileY, tileSize)`

**Returns:** `{ x, y }` — screen pixel coordinates

### `createSpriteRegistry()`

**Returns:** `SpriteRegistry` — `{ register, draw }`

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(type: string, drawFn: (...args: unknown[]) => void) => void` | Register a sprite draw function |
| `draw` | `(type: string, ...args: unknown[]) => void` | Draw a registered sprite (magenta fallback if unregistered) |

---

## detection.ts

Entity and prop detection helpers for interaction systems.

### `getEntityInFront(player, entities, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `Player` | (required) | Player object |
| `entities` | `DetectableEntity[]` | (required) | Entities to search |
| `opts.map` | `string` | `undefined` | Filter by map name |
| `opts.threshold` | `number` | `0.8` | Squared distance threshold |
| `opts.filter` | `(entity) => boolean` | `undefined` | Custom filter |

**Returns:** `object | null` — first matching entity

### `isFacingProp(player, prop)`

**Returns:** `boolean` — whether player faces the prop (supports multi-tile)

### `isNearProp(player, prop, threshold?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `Player` | (required) | Player object |
| `prop` | `{ x, y, width?, height? }` | (required) | Prop object |
| `threshold` | `number` | `2.0` | Max Manhattan distance |

**Returns:** `boolean`

---

## interactions.ts

Priority-based interaction dispatch system.

### `createInteractionManager()`

**Returns:** `InteractionManager` — `{ register, unregister, handleInteraction, updatePrompt, getPrompt, getSources }`

### `register({ name, priority, handler, promptFn })`

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Source identifier |
| `priority` | `number` | Higher = checked first |
| `handler` | `(player: Player, context: Record<string, unknown>) => boolean` | Return true if handled |
| `promptFn` | `(player: Player, context: Record<string, unknown>) => string | null` | Return prompt text |

### `handleInteraction(player, context?)`

Dispatches to highest-priority handler. **Returns:** `boolean`

### `updatePrompt(player, context?)`

Updates the current prompt (call each frame).

### `getPrompt()`

**Returns:** `string | null` — current prompt text

**Events emitted:** `interaction-handled`, `interaction-none`, `prompt-show`, `prompt-hide`

---

## dialogue.ts

Dialogue system with multi-line text, choices, and close callbacks.

### `createDialogueSystem()`

**Returns:** `DialogueSystem` — `{ show, advance, moveChoice, selectChoice, close, isActive, getState }`

### `show(speakerData, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `speakerData` | `NPC` | (required) | Speaker with dialogue lines |
| `opts.choices` | `DialogueChoice[]` | `[]` | Choice options |
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

**Returns:** `DialogueState` — `{ active, speaker, lines, lineIndex, currentLine, choices, choiceIndex, choicesMade, hasMoreLines, showChoices }`

**Events emitted:** `dialogue-start`, `dialogue-line`, `dialogue-choices`, `dialogue-close`

---

## entities.ts

NPC and enemy entity management with patrol AI.

### `createEntityManager()`

**Returns:** `EntityManager` — `{ addNPC, addEnemy, getNPCs, getEnemies, updateEnemies, checkEnemyCollisions, getNPCInFront }`

### `addNPC(data)`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `x`, `y` | `number` | (required) | Tile position |
| `name` | `string` | `''` | Display name |
| `type` | `string` | `'npc'` | Entity type |
| `map` | `string` | `'default'` | Map name |
| `direction` | `Direction` | `'down'` | `'up' | 'down' | 'left' | 'right'` |
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

**Returns:** `Enemy | null` — the colliding enemy, or null

### `getNPCInFront(player, mapName, threshold?)`

**Returns:** `NPC | null` — NPC at the player's facing tile

**Events emitted:** `enemy-collision`

---

## inventory.ts

Two-hand inventory with backpack storage.

### `createInventory()`

**Returns:** `Inventory`

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `addItem` | `(item: Item)` | `boolean` | Add to first empty hand |
| `removeItem` | `(itemId: string)` | `Item | null` | Remove by type ID |
| `getItem` | `(itemId: string)` | `Item | null` | Get by type ID |
| `hasItem` | `(itemId: string)` | `boolean` | Check if equipped |
| `swapHands` | `()` | `void` | Swap left/right |
| `isFull` | `()` | `boolean` | Both hands occupied |
| `equipBackpack` | `(type: BackpackType)` | `void` | Equip backpack (sets storage capacity) |
| `unequipBackpack` | `()` | `BackpackType | null` | Unequip and return type |
| `addToStorage` | `(itemId: string)` | `boolean` | Add to backpack storage |
| `removeFromStorage` | `(itemId: string)` | `string | null` | Remove from storage |
| `clear` | `()` | `void` | Reset everything |

**Events emitted:** `item-acquired`, `item-removed`

---

## items.ts

Item type registry and world item management.

### `createItemRegistry()`

**Returns:** `ItemRegistry` — `{ register, get, isQuest, canDrop, canStore, all }`

### `createWorldItems()`

**Returns:** `WorldItems` — `{ addItem, getItems, checkPickup, pickup, remove, clear }`

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `addItem` | `(mapName: string, itemId: string, x: number, y: number)` | `WorldItem` | Place item on ground |
| `getItems` | `(mapName: string)` | `WorldItem[]` | Get items on map |
| `checkPickup` | `(px: number, py: number, map: string, radius?: number)` | `WorldItem | null` | Find nearby item |
| `pickup` | `(item: WorldItem, inventory: Inventory)` | `boolean` | Pick up into inventory |
| `remove` | `(item: WorldItem)` | `boolean` | Remove from world |
| `clear` | `(mapName?: string)` | `void` | Clear all items on map |

**Events emitted:** `world-item-added`, `world-item-picked`, `world-item-removed`

---

## props.ts

Prop collision tile generation.

### `generatePropCollisionTiles(props)`

| Param | Type | Description |
|-------|------|-------------|
| `props` | `Prop[]` | Prop definitions with `x`, `y`, and either `solidTiles` or `collidable` |

**Returns:** `PropCollisionTile[]` — flat collision tile positions

---

## health.ts

Health system with damage/healing and game-over callback.

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `damagePlayer` | `(amount: number) => void` | Deal damage (clamped to 0, ignores negative) |
| `healPlayer` | `(amount: number) => void` | Heal (clamped to maxHealth, ignores negative) |
| `setOnGameOverCallback` | `(fn: () => void) => void` | Set death callback |
| `createDamageCooldown` | `(frames?: number) => DamageCooldown` | Create invincibility timer (default 60 frames) |

### `createDamageCooldown(frames?)` Returns: `DamageCooldown`

| Method | Description |
|--------|-------------|
| `canDamage()` | `boolean` — whether player can take damage |
| `recordHit()` | Start cooldown |
| `tick()` | Decrement cooldown each frame |

**Events emitted:** `health-changed`, `player-died`

---

## notifications.ts

SNES-style floating notification system.

### `showNotification(text, opts?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | `string` | (required) | Notification text |
| `opts.duration` | `number` | `2000` | Display time (ms) |
| `opts.theme` | `NotificationTheme` | `'default'` | `'default' | 'locked' | 'item'` |
| `opts.container` | `HTMLElement` | `document.body` | Parent element |

**Returns:** `NotificationHandle` — `{ cancel }` — remove notification early

---

## transitions.ts

Map transition system with position locking.

### `transitionTo({ mapName, maps, x, y, facing?, tileSize? })`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mapName` | `string` | (required) | Target map key |
| `maps` | `Record<string, number[][]>` | (required) | Maps registry |
| `x`, `y` | `number` | (required) | Spawn position |
| `facing` | `Direction` | `undefined` | `'up' | 'down' | 'left' | 'right'` |
| `tileSize` | `number` | `16` | Tile size for camera snap |

**Events emitted:** `map-changed`

---

## animation.ts

Rate-limited animation frame counter.

### `createAnimationCounter({ frames, interval })`

| Param | Type | Description |
|-------|------|-------------|
| `frames` | `number` | Number of frames in cycle |
| `interval` | `number` | Ticks between frame advances |

**Returns:** `AnimationCounter` — `{ update, frame, reset }`

| Method | Returns | Description |
|--------|---------|-------------|
| `update()` | `number` | Advance counter, return current frame |
| `frame` | `number` | Current frame (getter) |
| `reset()` | `void` | Reset to frame 0 |

---

## events.ts

Minimal pub/sub event bus.

### `createEventBus()`

**Returns:** `EventBus` — `{ on, once, off, emit }`

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
| `player-died` | `{ health }` | health.ts | Health reaches 0 |
| `health-changed` | `{ health, maxHealth }` | health.ts | After damage or heal |
| `item-acquired` | `Item` | inventory.ts | Item added to hand |
| `item-removed` | `Item` | inventory.ts | Item removed from hand |
| `map-changed` | `{ mapName, map }` | transitions.ts | After map transition |
| `dialogue-start` | `{ speaker, line }` | dialogue.ts | Dialogue begins |
| `dialogue-line` | `{ speaker, line }` | dialogue.ts | Line advances |
| `dialogue-choices` | `{ choices }` | dialogue.ts | Choices displayed |
| `dialogue-close` | — | dialogue.ts | Dialogue closed |
| `interact` | — | input.ts | Space key pressed |
| `pause-toggle` | — | input.ts | Pause key pressed |
| `enemy-collision` | `{ enemy }` | entities.ts | Player touches enemy |
| `world-item-added` | `{ mapName, item }` | items.ts | Item placed on ground |
| `world-item-picked` | `{ item }` | items.ts | Item picked up |
| `world-item-removed` | `{ mapName, item }` | items.ts | Item removed from world |
| `interaction-handled` | `{ source, player }` | interactions.ts | Source handled interaction |
| `interaction-none` | `{ player }` | interactions.ts | No source handled |
| `prompt-show` | `{ text, source }` | interactions.ts | Prompt displayed |
| `prompt-hide` | — | interactions.ts | Prompt removed |
