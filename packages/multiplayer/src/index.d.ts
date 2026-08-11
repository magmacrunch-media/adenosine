export declare const MSG: {
  readonly JOIN: 'join';
  readonly CREATE_ROOM: 'create_room';
  readonly JOIN_ROOM: 'join_room';
  readonly SPECTATE: 'spectate';
  readonly START_GAME: 'start_game';
  readonly GAME_ACTION: 'game_action';
  readonly CHAT: 'chat';
  readonly QUIT: 'quit';
  readonly LOBBY_SNAPSHOT: 'lobby_snapshot';
  readonly WELCOME: 'welcome';
  readonly SPECTATOR_WELCOME: 'spectator_welcome';
  readonly REJECTED: 'rejected';
  readonly LOBBY_UPDATE: 'lobby_update';
  readonly GAME_STARTED: 'game_started';
  readonly GAME_STATE: 'game_state';
  readonly GAME_ACTION_BC: 'game_action';
  readonly CHAT_MSG: 'chat';
  readonly SYSTEM_MSG: 'system';
  readonly PLAYER_QUIT: 'player_quit';
};

export declare const MP_PALETTE: string[];

export interface MPMessage {
  type: string;
  [key: string]: unknown;
}

export interface MP {
  onConnected(): void;
  onDisconnected(): void;
  onRejected(reason: string): void;
  onWelcome(data: MPMessage): void;
  onSpectatorWelcome(data: MPMessage): void;
  onLobbyUpdate(data: MPMessage): void;
  onLobbySnapshot(data: MPMessage): void;
  onGameStarted(data: MPMessage): void;
  onGameState(state: unknown): void;
  onGameAction(action: unknown): void;
  onChatMessage(from: string, text: string, color: string): void;
  onSystemMessage(text: string): void;
  onPlayerJoined(data: MPMessage): void;
  onPlayerQuit(data: MPMessage): void;
  onRoomCreated(code: string): void;
  onRoomJoined(code: string): void;
  onError(text: string): void;

  getMyName(): string | null;
  getMyColor(): string | null;
  getRoomCode(): string | null;
  amIHost(): boolean;
  isSpectator(): boolean;
  isConnected(): boolean;

  connect(server?: string): void;
  join(name: string, color: string, room?: string): void;
  createRoom(name: string, color: string, roomCode: string): void;
  joinRoom(name: string, color: string, roomCode: string): void;
  spectate(name: string, room?: string): void;
  startGame(): void;
  sendAction(action: unknown): void;
  sendChat(text: string): void;
  quit(): void;
}
