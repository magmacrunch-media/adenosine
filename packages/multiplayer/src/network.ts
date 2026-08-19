/**
 * network.ts — Shared multiplayer client layer
 * Game-agnostic WebSocket client for browser games.
 *
 * Usage:
 *   MP.connect('wss://myserver.com');
 *   MP.onConnected = () => { ... };
 *   MP.onGameState = (state) => { ... };
 *   MP.sendAction({ type: 'play_card', card: {...} });
 *
 * With no argument, connect() targets the page's own origin. A deployment whose
 * game server lives on a different host declares that once, up front:
 *
 *   MP.configure({ defaultServer: 'games.example.com/chess',
 *                  allowlist: ['games.example.com'] });
 */

/** Any message from the server. `type` selects the shape of the rest. */
export interface MPMessage {
  type: string;
  [key: string]: unknown;
}

/** Set by the consuming page before the client connects. Predates configure()
 *  and is still honoured, since pages in the wild set it. */
declare const MP_DEFAULT_SERVER: string | undefined;

/** Deployment-specific wiring, supplied by the host app via MP.configure(). */
export interface MPConfig {
  /** Where connect() goes when called with no argument. Bare "host[:port][/path]"
   *  is preferred — the scheme is chosen from the page protocol. */
  defaultServer?: string;
  /** Extra hosts a ?server= override may name, on top of the page's own origin
   *  and the private ranges. */
  allowlist?: readonly string[];
}

/** Read an optional string field off a loosely-typed server message. */
function str(msg: MPMessage, key: string): string {
  const v = msg[key];
  return typeof v === 'string' ? v : '';
}

export const MP = {

  // ── Callbacks (assign before calling connect) ────────────────────────────

  onConnected(): void {},
  onDisconnected(): void {},
  onRejected(_reason: string): void {},
  onWelcome(_data: MPMessage): void {},
  onSpectatorWelcome(_data: MPMessage): void {},
  onLobbyUpdate(_data: MPMessage): void {},
  onLobbySnapshot(_data: MPMessage): void {},
  onGameStarted(_data: MPMessage): void {},
  onGameState(_state: unknown): void {},
  onGameAction(_action: unknown): void {},
  onChatMessage(_from: string, _text: string, _color: string): void {},
  onSystemMessage(_text: string): void {},
  onPlayerJoined(_data: MPMessage): void {},
  onPlayerQuit(_data: MPMessage): void {},
  onRoomCreated(_code: string): void {},
  onRoomJoined(_code: string): void {},
  onError(_text: string): void {},

  // ── State ────────────────────────────────────────────────────────────────

  _socket: null as WebSocket | null,
  _myName: null as string | null,
  _myColor: null as string | null,
  _roomCode: null as string | null,
  _isHost: false,
  _isSpectator: false,

  // ── Getters ──────────────────────────────────────────────────────────────

  getMyName(): string | null { return MP._myName; },
  getMyColor(): string | null { return MP._myColor; },
  getRoomCode(): string | null { return MP._roomCode; },
  amIHost(): boolean { return MP._isHost; },
  isSpectator(): boolean { return MP._isSpectator; },
  isConnected(): boolean {
    return MP._socket !== null && MP._socket.readyState === WebSocket.OPEN;
  },

  // ── Connect ──────────────────────────────────────────────────────────────

  connect(server?: string): void {
    const addr = server || MP._resolveServer();
    const url = addr.startsWith('ws') ? addr : MP._scheme(addr) + addr;

    MP._socket = new WebSocket(url);

    MP._socket.addEventListener('open', () => {
      MP.onConnected();
    });

    MP._socket.addEventListener('close', () => {
      MP._myName = null;
      MP._myColor = null;
      MP._roomCode = null;
      MP._isHost = false;
      MP._isSpectator = false;
      MP.onDisconnected();
    });

    MP._socket.addEventListener('error', () => {
      MP.onError('Connection error — is the server running?');
    });

    MP._socket.addEventListener('message', (e: MessageEvent) => {
      let msg: MPMessage;
      try { msg = JSON.parse(String(e.data)) as MPMessage; }
      catch { console.error('[MP] Bad JSON:', e.data); return; }
      MP._handle(msg);
    });
  },

  // Deployment wiring from configure(). Empty by default: an install that
  // configures nothing talks to its own origin and nowhere else.
  _config: {} as MPConfig,

  /**
   * Declare where this deployment's game server lives.
   *
   * Call before connect(). Both fields are optional and merge over whatever a
   * previous call set, so a page can name its server without restating the
   * allowlist.
   */
  configure(cfg: MPConfig): void {
    MP._config = { ...MP._config, ...cfg };
  },

  // Hosts the ?server= override is allowed to name. Without this a crafted link
  // can point a visitor's game socket, and the name they play under, at any
  // host the attacker chooses.
  //
  // The page's own origin is always allowed; anything else a deployment needs
  // it declares through configure({ allowlist }). Hardcoding one deployment's
  // hosts here would hand every other install a socket pointed at a stranger.
  _allowlist(): readonly string[] {
    const extra = MP._config.allowlist ?? [];
    const own: string[] = ['localhost', '127.0.0.1'];
    try {
      if (window.location.hostname) own.push(window.location.hostname);
    } catch { /* no window */ }
    return [...own, ...extra];
  },

  // RFC1918. Note 172 is only private from 172.16 to 172.31 — a bare /^172\./
  // also swallows public addresses such as 172.217.14.5.
  _PRIVATE: /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/,

  _hostOf(addr: string): string {
    return String(addr).replace(/^wss?:\/\//, '').split('/')[0]!.split(':')[0]!;
  },

  _isAllowed(addr: string): boolean {
    const host = MP._hostOf(addr);
    // Private ranges stay open so LAN play and dev servers keep working.
    if (MP._PRIVATE.test(host)) return true;
    return MP._allowlist().indexOf(host) !== -1;
  },

  // A ws: socket opened from an https: page is blocked as mixed content, so the
  // scheme has to follow the page rather than the address. Loopback and LAN
  // addresses have no certificate and stay on plain ws:.
  _scheme(addr: string): string {
    const host = MP._hostOf(addr);
    if (host === 'localhost' || host === '127.0.0.1' || MP._PRIVATE.test(host)) return 'ws://';
    try {
      return window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    } catch { return 'ws://'; }
  },

  _resolveServer(): string {
    try {
      const param = new URLSearchParams(window.location.search).get('server');
      if (param && param.trim()) {
        if (MP._isAllowed(param.trim())) return param.trim();
        console.warn('[MP] ignoring ?server= override for non-allowlisted host: ' + MP._hostOf(param));
      }
    } catch { /* no window, or an unparsable query */ }
    if (MP._config.defaultServer) return MP._config.defaultServer;
    if (typeof MP_DEFAULT_SERVER !== 'undefined') return MP_DEFAULT_SERVER;
    // Nothing configured: talk to the origin that served the page. Naming a
    // specific deployment's host here would mean every unconfigured install
    // silently opened a socket to someone else's server.
    try {
      return window.location.host;
    } catch { return 'localhost'; }
  },

  // ── Senders ──────────────────────────────────────────────────────────────

  _send(obj: Record<string, unknown>): void {
    if (MP.isConnected()) MP._socket!.send(JSON.stringify(obj));
    else console.warn('[MP] Not connected, cannot send:', obj);
  },

  join(name: string, color: string, room?: string): void {
    MP._myName = name;
    MP._send({ type: 'join', name, color, room: room || null });
  },

  createRoom(name: string, color: string, roomCode: string): void {
    MP._myName = name;
    MP._send({ type: 'create_room', name, color, room: roomCode });
  },

  joinRoom(name: string, color: string, roomCode: string): void {
    MP._myName = name;
    MP._send({ type: 'join_room', name, color, room: roomCode });
  },

  spectate(name: string, room?: string): void {
    MP._isSpectator = true;
    MP._myName = name;
    MP._send({ type: 'spectate', name, room: room || null });
  },

  startGame(): void {
    MP._send({ type: 'start_game' });
  },

  sendAction(action: unknown): void {
    MP._send({ type: 'game_action', action });
  },

  sendChat(text: string): void {
    MP._send({ type: 'chat', text });
  },

  quit(): void {
    MP._send({ type: 'quit' });
    MP._myName = null;
    MP._roomCode = null;
  },

  // ── Message Handler ──────────────────────────────────────────────────────

  _handle(msg: MPMessage): void {
    switch (msg.type) {

      case 'lobby_snapshot':
        MP.onLobbySnapshot(msg);
        break;

      case 'welcome':
        MP._myName = str(msg, 'playerName');
        MP._roomCode = str(msg, 'room');
        MP._isHost = msg['isHost'] === true;
        MP._myColor = str(msg, 'chosenColor');
        MP._isSpectator = false;
        MP.onWelcome(msg);
        MP.onRoomJoined(str(msg, 'room'));
        break;

      case 'spectator_welcome':
        MP._myName = str(msg, 'playerName');
        MP._roomCode = str(msg, 'room');
        MP._isSpectator = true;
        MP._isHost = false;
        MP.onSpectatorWelcome(msg);
        MP.onRoomJoined(str(msg, 'room'));
        break;

      case 'rejected':
        MP.onRejected(str(msg, 'reason'));
        break;

      case 'lobby_update':
        MP.onLobbyUpdate(msg);
        break;

      case 'game_started':
        MP.onGameStarted(msg);
        break;

      case 'game_state':
        MP.onGameState(msg['state']);
        break;

      case 'game_action':
        MP.onGameAction(msg['action']);
        break;

      case 'chat':
        MP.onChatMessage(str(msg, 'from'), str(msg, 'text'), str(msg, 'color'));
        break;

      case 'system':
        MP.onSystemMessage(str(msg, 'text'));
        break;

      case 'player_quit':
        MP.onPlayerQuit(msg);
        break;

      default:
        console.warn('[MP] Unknown message:', msg.type);
    }
  },
};
