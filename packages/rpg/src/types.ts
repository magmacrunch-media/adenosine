// engine/types.ts
// Central type definitions for Adenosine.

// ── Core Data Types ──────────────────────────────────────────────

export interface Player {
    x: number;
    y: number;
    facingX: number;
    facingY: number;
    direction: Direction;
    isWalking: boolean;
    wasMoving: boolean;
    health: number;
    maxHealth: number;
    positionLocked: boolean;
}

export interface NPC {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    type: string;
    map: string;
    direction: Direction;
    dialogue: string[];
}

export interface Enemy {
    x: number;
    y: number;
    width: number;
    height: number;
    map: string;
    type: string;
    direction: number;
    moveCounter: number;
    moveSpeed: number;
    patrolRange: number;
    startX: number;
    startY: number;
    damage: number;
}

export type Entity = NPC | Enemy;

export interface Prop {
    x: number;
    y: number;
    width?: number;
    height?: number;
    visible?: boolean;
    collidable?: boolean;
    solidTiles?: Array<{ dx: number; dy: number }>;
}

export interface PropCollisionTile {
    x: number;
    y: number;
}

// ── Item Types ───────────────────────────────────────────────────

export interface ItemTypeDef {
    id: string;
    name?: string;
    required?: boolean;
    canDrop?: boolean;
    canStore?: boolean;
}

export interface Item {
    type: ItemTypeDef;
}

export interface BackpackType {
    id: string;
    storageCapacity?: number;
}

export interface WorldItem {
    itemId: string;
    x: number;
    y: number;
}

// ── Inventory ────────────────────────────────────────────────────

export interface Inventory {
    leftHand: Item | null;
    rightHand: Item | null;
    backpack: BackpackType | null;
    storage: string[];
    addItem(item: Item): boolean;
    removeItem(itemId: string): Item | null;
    getItem(itemId: string): Item | null;
    hasItem(itemId: string): boolean;
    swapHands(): void;
    isFull(): boolean;
    equipBackpack(type: BackpackType): void;
    unequipBackpack(): BackpackType | null;
    addToStorage(itemId: string): boolean;
    removeFromStorage(itemId: string): string | null;
    clear(): void;
}

// ── Dialogue ─────────────────────────────────────────────────────

export interface DialogueChoice {
    label?: string;
    callback?: () => void;
}

export interface DialogueState {
    active: boolean;
    speaker: NPC | null;
    lines: string[];
    lineIndex: number;
    currentLine: string | null;
    choices: DialogueChoice[];
    choiceIndex: number;
    choicesMade: boolean;
    hasMoreLines: boolean;
    showChoices: boolean;
}

export interface DialogueSystem {
    show(speakerData: NPC, opts?: { choices?: DialogueChoice[]; onClose?: () => void }): void;
    advance(): void;
    moveChoice(dir: number): void;
    selectChoice(): void;
    close(): void;
    isActive(): boolean;
    getState(): DialogueState;
}

// ── Events ───────────────────────────────────────────────────────

export interface EventMap {
    'pause-toggle': void;
    'interact': void;
    'enemy-collision': { enemy: Enemy };
    'item-acquired': Item;
    'item-removed': Item;
    'dialogue-start': { speaker: NPC; line: string };
    'dialogue-choices': { choices: DialogueChoice[] };
    'dialogue-line': { speaker: NPC; line: string };
    'dialogue-close': void;
    'interaction-handled': { source: string; player: Player };
    'interaction-none': { player: Player };
    'prompt-show': { text: string; source: string };
    'prompt-hide': void;
    'health-changed': { health: number; maxHealth: number };
    'player-died': { health: number };
    'map-changed': { mapName: string; map: number[][] };
    'world-item-added': { mapName: string; item: WorldItem };
    'world-item-picked': { item: WorldItem };
    'world-item-removed': { mapName: string; item: WorldItem };
}

export type EventName = keyof EventMap;

// ── Constants ────────────────────────────────────────────────────

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
    up:    { x: 0, y: -1 },
    down:  { x: 0, y: 1 },
    left:  { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventListener = (...args: any[]) => void;

export interface EventBus {
    on<K extends EventName>(event: K, fn: EventMap[K] extends void ? () => void : (data: EventMap[K]) => void): () => void;
    once<K extends EventName>(event: K, fn: EventMap[K] extends void ? () => void : (data: EventMap[K]) => void): () => void;
    off(event: EventName, fn: EventListener): void;
    emit<K extends EventName>(event: K, ...args: EventMap[K] extends void ? [] : [EventMap[K]]): void;
}

// ── Input ────────────────────────────────────────────────────────

export interface KeyBindings {
    moveUp: string[];
    moveDown: string[];
    moveLeft: string[];
    moveRight: string[];
    pause: string[];
    interact: string[];
}

export interface InputListener {
    destroy(): void;
}

export interface InitInputOpts {
    onPause?: () => void;
    onInteract?: () => void;
    bindings?: KeyBindings;
}

// ── Camera ───────────────────────────────────────────────────────

export interface Camera {
    x: number;
    y: number;
}

export interface UpdateCameraOpts {
    target?: { x: number; y: number };
    tileSize?: number;
    mapWidth?: number;
    mapHeight?: number;
    smoothing?: number;
}

// ── Collision ────────────────────────────────────────────────────

export interface CollisionOptions {
    map?: number[][];
    solidTiles?: number[];
    entities?: Entity[];
    props?: PropCollisionTile[];
}

// ── Movement ─────────────────────────────────────────────────────

export interface HandleMovementOpts {
    speed?: number;
    dt?: number;
    isBlocked?: () => boolean;
    collisionOpts?: CollisionOptions;
    bindings?: KeyBindings;
}

// ── Renderer ─────────────────────────────────────────────────────

export interface RenderLayer {
    sortY: number;
    render: (ctx: CanvasRenderingContext2D) => void;
}

export interface RenderWorldOpts {
    map: number[][];
    tileSize: number;
    renderTile: (
        ctx: CanvasRenderingContext2D,
        screenX: number,
        screenY: number,
        tileId: number,
        tileX: number,
        tileY: number,
    ) => void;
    layers?: RenderLayer[];
    background?: (ctx: CanvasRenderingContext2D) => void;
}

export interface SpriteRegistry {
    register(type: string, drawFn: (...args: unknown[]) => void): void;
    draw(type: string, ...args: unknown[]): void;
}

// ── Sprite sheets ────────────────────────────────────────────────

export interface SpriteSheetOpts {
    frameWidth: number;
    frameHeight: number;
    /** Anchor within a frame. draw() lands this pixel on the given (x, y). */
    originX?: number;
    originY?: number;
}

export interface DrawSpriteOpts {
    scaleX?: number;
    scaleY?: number;
    /** Mirrors the frame about the origin, so a facing flip stays put. */
    flipX?: boolean;
    flipY?: boolean;
    alpha?: number;
}

export interface SpriteSheet {
    readonly image: CanvasImageSource;
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly cols: number;
    readonly rows: number;
    readonly frameCount: number;
    originX: number;
    originY: number;
    /** Frame index, counted left-to-right then top-to-bottom. */
    draw(
        ctx: CanvasRenderingContext2D,
        frame: number,
        x: number,
        y: number,
        opts?: DrawSpriteOpts,
    ): void;
    drawCell(
        ctx: CanvasRenderingContext2D,
        col: number,
        row: number,
        x: number,
        y: number,
        opts?: DrawSpriteOpts,
    ): void;
}

// ── Detection ────────────────────────────────────────────────────

export interface DetectionOpts {
    map?: string;
    threshold?: number;
    filter?: (entity: Entity) => boolean;
}

// ── Interactions ─────────────────────────────────────────────────

export interface InteractionSource {
    name: string;
    priority: number;
    handler: (player: Player, context: Record<string, unknown>) => boolean;
    promptFn?: (player: Player, context: Record<string, unknown>) => string | null;
}

export interface InteractionManager {
    register(source: InteractionSource): void;
    unregister(name: string): void;
    handleInteraction(player: Player, context?: Record<string, unknown>): boolean;
    updatePrompt(player: Player, context?: Record<string, unknown>): void;
    getPrompt(): string | null;
    getSources(): InteractionSource[];
}

// ── Entities ─────────────────────────────────────────────────────

export interface AddNPCData {
    x: number;
    y: number;
    width?: number;
    height?: number;
    name?: string;
    type?: string;
    map?: string;
    direction?: Direction;
    dialogue?: string[];
}

export interface AddEnemyData {
    x: number;
    y: number;
    width?: number;
    height?: number;
    map?: string;
    type?: string;
    direction?: number;
    moveSpeed?: number;
    patrolRange?: number;
    damage?: number;
}

export interface EntityManager {
    addNPC(data: AddNPCData): NPC;
    addEnemy(data: AddEnemyData): Enemy;
    getNPCs(mapName?: string): NPC[];
    getEnemies(mapName?: string): Enemy[];
    updateEnemies(mapName: string, isSolidFn: (x: number, y: number) => boolean, dt?: number): void;
    checkEnemyCollisions(playerX: number, playerY: number, mapName: string, damageCallback: (damage: number) => void): Enemy | null;
    getNPCInFront(player: Player, mapName: string, threshold?: number): NPC | null;
}

// ── Items ────────────────────────────────────────────────────────

export interface ItemRegistry {
    register(typeDef: ItemTypeDef): void;
    get(id: string): ItemTypeDef | null;
    isQuest(id: string): boolean;
    canDrop(id: string): boolean;
    canStore(id: string): boolean;
    all(): ItemTypeDef[];
}

export interface WorldItems {
    addItem(mapName: string, itemId: string, x: number, y: number): WorldItem;
    getItems(mapName: string): WorldItem[];
    checkPickup(playerX: number, playerY: number, mapName: string, radius?: number): WorldItem | null;
    pickup(item: WorldItem, inventory: Inventory): boolean;
    remove(item: WorldItem): boolean;
    clear(mapName?: string): void;
}

// ── Health ───────────────────────────────────────────────────────

export interface DamageCooldown {
    canDamage(): boolean;
    recordHit(): void;
    tick(): void;
}

// ── Notifications ────────────────────────────────────────────────

export type NotificationTheme = 'default' | 'locked' | 'item';

export interface NotificationOpts {
    duration?: number;
    theme?: NotificationTheme;
    container?: HTMLElement;
}

export interface NotificationHandle {
    cancel(): void;
}

// ── Transitions ──────────────────────────────────────────────────

export interface TransitionOpts {
    mapName: string;
    maps: Record<string, number[][]>;
    x: number;
    y: number;
    facing?: Direction;
    tileSize?: number;
}

// ── Animation ────────────────────────────────────────────────────

export interface AnimationCounterOpts {
    frames: number;
    interval: number;
}

export interface AnimationCounter {
    update(): number;
    readonly frame: number;
    reset(): void;
}

// ── Game Loop ────────────────────────────────────────────────────

export interface GameLoopOpts {
    update?: (dt: number) => void;
    render?: () => void;
    fps?: number;
}

export interface GameLoop {
    start(): void;
    stop(): void;
}
