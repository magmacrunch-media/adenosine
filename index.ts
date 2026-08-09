// engine/index.ts
// Magma Engine — main entry point.
// Import everything from here, or import individual modules.

export { player, map, canvas, ctx, initCanvas, currentMap, setCurrentMap, setMap, gameStarted, setGameStarted, gamePaused, setGamePaused, gameOver, setGameOver, transitionCooldown, setTransitionCooldown, animationFrame, frameCounter, waterAnimFrame, waterAnimCounter, campfireAnimFrame, campfireAnimCounter } from './state.js';
export { createGameLoop } from './game-loop.js';
export { keys, keysPressed, initInput } from './input.js';
export { camera, updateCamera } from './camera.js';
export { isSolid } from './collision.js';
export { handleMovement } from './movement.js';
export { renderWorld, tileToScreen, createSpriteRegistry } from './renderer.js';
export { createInventory } from './inventory.js';
export { showNotification } from './notifications.js';
export { damagePlayer, healPlayer, setOnGameOverCallback, createDamageCooldown } from './health.js';
export { transitionTo } from './transitions.js';
export { DEFAULT_BINDINGS } from './bindings.js';
export { createEventBus, engine } from './events.js';
export { createAnimationCounter } from './animation.js';
export { getEntityInFront, isFacingProp, isNearProp } from './detection.js';
export { generatePropCollisionTiles } from './props.js';
export { createItemRegistry, createWorldItems } from './items.js';
export { createEntityManager } from './entities.js';
export { createDialogueSystem } from './dialogue.js';
export { createInteractionManager } from './interactions.js';

export { DIRECTION_VECTORS } from './types.js';

export type {
    Player,
    NPC,
    Enemy,
    Entity,
    Direction,
    Prop,
    PropCollisionTile,
    ItemTypeDef,
    Item,
    BackpackType,
    WorldItem,
    Inventory,
    DialogueChoice,
    DialogueState,
    DialogueSystem,
    EventBus,
    EventMap,
    EventName,
    KeyBindings,
    InputListener,
    Camera,
    UpdateCameraOpts,
    CollisionOptions,
    RenderLayer,
    RenderWorldOpts,
    SpriteRegistry,
    DetectionOpts,
    InteractionSource,
    InteractionManager,
    AddNPCData,
    AddEnemyData,
    EntityManager,
    ItemRegistry,
    WorldItems,
    DamageCooldown,
    NotificationTheme,
    NotificationOpts,
    NotificationHandle,
    TransitionOpts,
    AnimationCounterOpts,
    AnimationCounter,
    GameLoopOpts,
    GameLoop,
    HandleMovementOpts,
} from './types.js';
