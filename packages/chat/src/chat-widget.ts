/**
 * chat-widget.js — Floating arcade chat widget
 * Self-contained: creates its own DOM, handles connection, state.
 *
 * Usage:
 *   <link rel="stylesheet" href="shared/chat-widget.css">
 *   <script src="shared/chat-widget.js"></script>
 *   <script>ChatWidget.connect();</script>
 *
 * connect() targets the origin that served the page. A deployment whose chat
 * server lives elsewhere names it:
 *
 *   ChatWidget.connect({ server: 'chat.example.com', allowlist: ['chat.example.com'] });
 *
 * Public API:
 *   ChatWidget.connect()
 *   ChatWidget.disconnect()
 *   ChatWidget.joinRoom(code)
 *   ChatWidget.leaveRoom(code)
 *   ChatWidget.setName(name)
 *   ChatWidget.setColor(color)
 *   ChatWidget.getMyName()
 *   ChatWidget.getMyColor()
 */


/** Options accepted by ChatWidget.connect(). */
export interface ConnectOptions {
  /** Override the SharedWorker URL. Resolved from the loading script otherwise. */
  workerUrl?: string;
  /** Where the chat server lives. Accepts "host[:port][/path]" — the scheme is
   *  taken from the page protocol — or a full ws:// / wss:// URL. Defaults to
   *  the origin that served the page. */
  server?: string;
  /** Extra hosts a ?server= override may name, on top of the page's own origin. */
  allowlist?: readonly string[];
}

/** A message from the chat server. `type` selects the rest of the shape. */
export interface ChatMessage {
  type: string;
  [key: string]: unknown;
}

/** A user in the online list. */
export interface OnlineUser {
  name: string;
  color?: string;
  /** Set when the user is inside a game rather than the global room. */
  game?: string;
  /** Room codes the user has joined. */
  rooms?: string[];
}

export const ChatWidget = (function() {
    'use strict';

    // ── Config ──────────────────────────────────────────────────────────

    // An https: page may only open wss: sockets — a ws: URL is blocked as mixed
    // content before it ever reaches the network.
    var WS_SCHEME = (function() {
        try {
            return window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        } catch(e) { return 'ws://'; }
    })();

    function hostOf(addr: string): string {
        return String(addr).replace(/^wss?:\/\//, '').split('/')[0]!.split(':')[0]!;
    }

    // Hosts the ?server= override is allowed to name. The widget replays saved
    // credentials as soon as the socket opens, so an unrestricted override lets
    // a crafted link hand those to any host the visitor can reach.
    //
    // The page's own origin is always allowed; anything else a deployment needs
    // it passes to connect({ allowlist }). Hardcoding one deployment's hosts
    // here would point every other install's chat traffic at a stranger.
    function isAllowedServer(addr: string, extra?: readonly string[]): boolean {
        var host = hostOf(addr);
        var allowed: string[] = ['localhost', '127.0.0.1'];
        try {
            if (window.location.hostname) allowed.push(window.location.hostname);
        } catch(e) {}
        if (extra) allowed = allowed.concat(extra as string[]);
        for (var i = 0; i < allowed.length; i++) {
            if (host === allowed[i]) return true;
        }
        return false;
    }

    // Resolved at connect() rather than at module load, so options can reach it.
    var chatServer: string | null = null;

    function resolveChatServer(opts?: ConnectOptions): string {
        var withScheme = function(addr: string): string {
            return /^wss?:\/\//.test(addr) ? addr : WS_SCHEME + addr;
        };
        try {
            var param = new URLSearchParams(window.location.search).get('server');
            if (param && isAllowedServer(param, opts && opts.allowlist)) {
                return withScheme(param);
            }
            if (param) {
                console.warn('[ChatWidget] ignoring ?server= override for non-allowlisted host: ' + hostOf(param));
            }
        } catch(e) {}
        if (opts && opts.server) return withScheme(opts.server);
        // Nothing configured: talk to the origin that served the page. Naming a
        // specific deployment's host here would mean every unconfigured install
        // silently sent its users' chat, and their saved credentials, to
        // someone else's server.
        try {
            return WS_SCHEME + window.location.host;
        } catch(e) { return 'ws://localhost'; }
    }

    // Captured while this module is still evaluating: for a classic <script src>
    // that is the tag which loaded us, whatever the bundle happens to be called.
    //
    // The previous implementation scanned for a tag named literally
    // 'chat-widget.js'. That stopped matching once tsup renamed the output
    // (index.global.js, deployed as adenosine-chat.js), and its
    // /chat-widget\.js$/ anchor also failed against the ?v= cache-busters the
    // arcade appends. Both misses fell through to a page-relative guess, so the
    // SharedWorker silently never loaded and every page opened its own socket.
    var OWN_SCRIPT_SRC = (typeof document !== 'undefined' &&
        document.currentScript && (document.currentScript as HTMLScriptElement).src) || null;

    // Replacing /[^/]*$/ drops the filename *and* any query string with it.
    function resolveWorkerUrl(explicit?: string): string {
        if (explicit) return explicit;
        if (OWN_SCRIPT_SRC) return OWN_SCRIPT_SRC.replace(/[^/]*$/, 'chat-worker.js');
        var scripts = (typeof document !== 'undefined')
            ? Array.from(document.getElementsByTagName('script')) : [];
        for (let i = scripts.length - 1; i >= 0; i--) {
            const src = scripts[i]!.src;
            if (src && /(chat-widget|adenosine-chat|index\.global)\.js(\?|$)/.test(src)) {
                return src.replace(/[^/]*$/, 'chat-worker.js');
            }
        }
        return window.location.href.replace(/[^/]*$/, 'chat-worker.js');
    }

    // ── State ───────────────────────────────────────────────────────────

    let sock: WebSocket | null = null;
    let worker: SharedWorker | null = null;
    let usingWorker = false;
    let currentRoom: string | null = null;
    let myName: string | null = null;
    let myColor: string | null = null;
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let typingHideTimer: ReturnType<typeof setTimeout> | null = null;
    let unreadCount = 0;
    let isExpanded = false;
    let activeTab = 'global';
    let widgetEl: HTMLElement | null = null;

    /** Look up an element the widget itself created. */
    function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
        return document.getElementById(id) as T | null;
    }

    function getSessionToken() {
        try {
            var token = localStorage.getItem('arcade_chat_session');
            if (!token) {
                token = Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('arcade_chat_session', token);
            }
            return token;
        } catch(e) {
            return null;
        }
    }

    // ── DOM Creation ────────────────────────────────────────────────────

    function createWidget() {
        if (widgetEl) return;

        var w = document.createElement('div');
        w.id = 'arcadeChatWidget';
        w.className = 'acw minimized';
        w.innerHTML = [
            '<div class="acw-bar" id="acwBar">',
            '  <div class="acw-icon"></div>',
            '  <span class="acw-online-count" id="acwOnlineCount">0</span>',
            '  <span class="acw-badge" id="acwBadge" style="display:none">0</span>',
            '</div>',
            '<div class="acw-header">',
            '  <span class="acw-header-title" id="chatHeaderTitle">// ARCADE CHAT //</span>',
            '  <button class="acw-minimize" id="acwMinimize" aria-label="minimize">\u2014</button>',
            '</div>',
            '<div class="acw-window" id="acwWindow">',
            '  <div class="acw-name-row">',
            '    <span id="chatMyName" class="acw-my-name"></span>',
            '    <button id="chatEditName" class="acw-edit-name" title="Edit name">✎</button>',
            '    <button id="chatPickColor" class="acw-pick-color" title="Pick color">🎨</button>',
            '  </div>',
            '  <div id="colorPickerPopup" class="acw-color-popup" style="display:none">',
            '    <div id="colorStrip" class="acw-color-strip"></div>',
            '    <div class="acw-color-preview-row">',
            '      <span>Current:</span>',
            '      <div id="colorPreview" class="acw-color-preview"></div>',
            '      <button id="colorResetBtn" class="acw-color-reset-btn">Reset</button>',
            '    </div>',
            '  </div>',
            '  <div class="acw-tabs">',
            '    <button class="acw-tab active" data-tab="global">GLOBAL</button>',
            '    <button class="acw-tab" data-tab="online">ONLINE</button>',
            '  </div>',
            '  <div class="acw-messages" id="chatMessagesGlobal">',
            '    <div class="acw-msg system">Welcome to the arcade! Say hello.</div>',
            '  </div>',
            '  <div class="acw-online-panel" id="chatOnline">',
            '    <div id="chatOnlineList"></div>',
            '  </div>',
            '  <div class="acw-typing" id="chatTyping" style="display:none"></div>',
            '  <div class="acw-input">',
            '    <input id="chatInput" type="text" placeholder="Type a message..." maxlength="200">',
            '    <button id="chatSend">▶</button>',
            '  </div>',
            '</div>'
        ].join('\n');

        document.body.appendChild(w);
        widgetEl = w;

        var savedState = localStorage.getItem('acw_expanded');
        if (savedState === 'true') {
            expand();
        } else {
            minimize();
        }

        var savedName = localStorage.getItem('arcade_username');
        if (savedName) {
            myName = savedName;
        }

        var savedColor = localStorage.getItem('arcade_color');
        if (savedColor) {
            myColor = savedColor;
        }

        wireEvents();
    }

    // ── Event Wiring ────────────────────────────────────────────────────

    function wireEvents() {
        var bar = document.getElementById('acwBar');
        if (bar) {
            bar.addEventListener('click', function(e) {
                if ((e.target as Element | null)?.closest('.acw-badge')) return;
                toggle();
            });
        }

        var minBtn = document.getElementById('acwMinimize');
        if (minBtn) {
            minBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                minimize();
            });
        }

        var sendBtn = document.getElementById('chatSend');
        if (sendBtn) {
            sendBtn.addEventListener('click', send);
        }

        var input = document.getElementById('chatInput');
        if (input) {
            input!.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') send();
            });
            input!.addEventListener('input', handleTyping);
        }

        var editName = document.getElementById('chatEditName');
        if (editName) {
            editName.addEventListener('click', startEditName);
        }

        var pickColor = document.getElementById('chatPickColor');
        if (pickColor) {
            pickColor.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleColorPicker();
            });
        }

        var colorStrip = document.getElementById('colorStrip');
        if (colorStrip) {
            colorStrip!.addEventListener('click', function(e) {
                var rect = colorStrip!.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var hue = (x / rect.width) * 360;
                var color = hslToHex(hue, 100, 50);
                setColor(color);
            });
        }

        var resetBtn = document.getElementById('colorResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                myColor = null;
                localStorage.removeItem('arcade_color');
                updateColorDisplay();
                sendToServer({ type: 'set_color', color: null });
            });
        }

        const tabs = widgetEl!.querySelectorAll<HTMLElement>('.acw-tab');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset['tab'] ?? 'global');
            });
        });

        document.addEventListener('click', function(e) {
            var popup = document.getElementById('colorPickerPopup');
            if (popup && popup.style.display !== 'none') {
                if (!popup.contains(e.target as Node | null) && e.target !== pickColor) {
                    popup.style.display = 'none';
                }
            }
        });
    }

    // ── Toggle / Expand / Minimize ──────────────────────────────────────

    function toggle() {
        if (isExpanded) { minimize(); } else { expand(); }
    }

    function expand() {
        if (!widgetEl) return;
        isExpanded = true;
        widgetEl!.classList.remove('minimized');
        widgetEl!.classList.add('expanded');
        localStorage.setItem('acw_expanded', 'true');
        unreadCount = 0;
        updateBadge();
        var input = document.getElementById('chatInput');
        if (input) setTimeout(function() { input!.focus(); }, 100);
    }

    function minimize() {
        if (!widgetEl) return;
        isExpanded = false;
        widgetEl!.classList.remove('expanded');
        widgetEl!.classList.add('minimized');
        localStorage.setItem('acw_expanded', 'false');
    }

    // ── Badge / Notifications ───────────────────────────────────────────

    function addUnread() {
        if (isExpanded) return;
        unreadCount++;
        updateBadge();
    }

    function updateBadge() {
        var badge = document.getElementById('acwBadge');
        if (!badge) return;
        if (unreadCount > 0) {
            badge.style.display = '';
            badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
        } else {
            badge.style.display = 'none';
        }
    }

    // ── Connection ──────────────────────────────────────────────────────

    function connect(opts?: ConnectOptions): void {
        // Resolved once per connect and cached, because connectDirect() is also
        // the reconnect path and has no access to opts.
        chatServer = resolveChatServer(opts);
        createWidget();

        if (typeof SharedWorker !== 'undefined' && !worker) {
            try {
                worker = new SharedWorker(resolveWorkerUrl(opts && opts.workerUrl));
                usingWorker = true;

                worker!.port.onmessage = function(e) {
                    handleWorkerMessage(e.data);
                };
                worker!.port.start();

                worker!.port.postMessage(JSON.stringify({ _worker: 'connect', url: chatServer }));

                window.addEventListener('pagehide', function() {
                    try { worker!.port.postMessage(JSON.stringify({ _worker: 'disconnect' })); } catch(e) {}
                });

                return;
            } catch(e) {
                worker = null;
                usingWorker = false;
            }
        }

        connectDirect();
    }

    function connectDirect() {
        if (sock) return;
        sock = new WebSocket(chatServer || resolveChatServer());

        sock.onopen = function() {
            widgetEl!.classList.remove('disconnected');
            sendSavedCredentials();
        };

        sock.onmessage = function(e) {
            try { handleMessage(JSON.parse(e.data)); } catch(err) {}
        };

        sock.onclose = function() {
            widgetEl!.classList.add('disconnected');
            sock = null;
            setTimeout(connectDirect, 5000);
        };

        sock.onerror = function() { sock!.close(); };
    }

    function sendSavedCredentials() {
        var token = getSessionToken();
        const nameMsg: Record<string, unknown> = { type: 'set_name', name: myName || 'Player' };
        if (token) nameMsg['session_token'] = token;
        sendToServer(nameMsg);
        if (myColor) sendToServer({ type: 'set_color', color: myColor });
    }

    function handleWorkerMessage(data: string): void {
        var msg;
        try { msg = JSON.parse(data); } catch(e) { return; }
        if (msg._worker === 'connect') {
            widgetEl!.classList.remove('disconnected');
            sendSavedCredentials();
            return;
        }
        if (msg._worker === 'disconnect') {
            widgetEl!.classList.add('disconnected');
            return;
        }
        handleMessage(msg);
    }

    function sendToServer(obj: Record<string, unknown>): void {
        if (usingWorker && worker) {
            worker!.port.postMessage(JSON.stringify({ _worker: 'send', data: obj }));
        } else if (sock && sock!.readyState === WebSocket.OPEN) {
            sock!.send(JSON.stringify(obj));
        }
    }

    function disconnect() {
        if (currentRoom) leaveRoom(currentRoom);
        if (usingWorker && worker) {
            try { worker!.port.postMessage(JSON.stringify({ _worker: 'disconnect' })); } catch(e) {}
            try { worker!.port.close(); } catch(e) {}
            worker = null;
            usingWorker = false;
        }
        if (sock) { try { sock!.close(); } catch(e) {} }
        sock = null;
        myName = null;
        myColor = null;
    }

    // ── Message Handler ─────────────────────────────────────────────────

    function handleMessage(msg: ChatMessage): void {
        switch(msg.type) {
            case 'history':
                if (Array.isArray(msg['messages'])) {
                    (msg['messages'] as ChatMessage[]).forEach((m) => { addMessage('global', m); });
                }
                break;

            case 'chat':
                addMessage('global', msg);
                addUnread();
                break;

            case 'room_history':
                if (Array.isArray(msg['messages'])) {
                    (msg['messages'] as ChatMessage[]).forEach((m) => { addMessage('room', m); });
                }
                break;

            case 'room_chat':
                addMessage('room', msg);
                break;

            case 'name_assigned':
                myName = field(msg, 'name');
                localStorage.setItem('arcade_username', field(msg, 'name'));
                updateNameDisplay();
                break;

            case 'user_list':
                const users: OnlineUser[] = Array.isArray(msg['users']) ? (msg['users'] as OnlineUser[]) : [];
                updateOnlineList(users);
                updateOnlineCount(typeof msg['count'] === 'number' ? msg['count'] : users.length);
                if (myName) {
                    for (const u of users) {
                        if (u.name === myName) {
                            myColor = u.color ?? null;
                            updateColorDisplay();
                            break;
                        }
                    }
                }
                break;

            case 'typing':
                showTyping(field(msg, 'from'), field(msg, 'room'));
                break;

            case 'global_users':
                updateOnlineCount(typeof msg['count'] === 'number' ? msg['count'] : 0);
                break;

            case 'status':
                break;
        }
    }

    // ── Room Management ─────────────────────────────────────────────────

    function joinRoom(roomCode: string): void {
        currentRoom = roomCode;
        sendToServer({ type: 'join_room', room: roomCode });
        if (myName) {
            var token = getSessionToken();
            const nameMsg: Record<string, unknown> = { type: 'set_name', name: myName };
            if (token) nameMsg['session_token'] = token;
            sendToServer(nameMsg);
        }
        var headerTitle = document.getElementById('chatHeaderTitle');
        if (headerTitle) headerTitle.textContent = '// ROOM ' + roomCode + ' //';
        const roomTab = widgetEl!.querySelector<HTMLElement>('[data-tab="room"]');
        if (roomTab) roomTab.style.display = '';
        switchTab('global');
    }

    function leaveRoom(roomCode: string): void {
        sendToServer({ type: 'leave_room', room: roomCode });
        if (currentRoom === roomCode) {
            currentRoom = null;
            var headerTitle = document.getElementById('chatHeaderTitle');
            if (headerTitle) headerTitle.textContent = '// ARCADE CHAT //';
        }
    }

    // ── Send ────────────────────────────────────────────────────────────

    function send() {
        var input = document.getElementById('chatInput');
        if (!input) return;
        var connected = (usingWorker && worker) || (sock && sock!.readyState === WebSocket.OPEN);
        if (!connected) return;
        const text = (input as HTMLInputElement | null)!.value.trim();
        if (!text) return;

        var name = myName || 'Player';
        var token = getSessionToken();
        const nameMsg: Record<string, unknown> = { type: 'set_name', name: name };
        if (token) nameMsg['session_token'] = token;
        sendToServer(nameMsg);

        var msg = { type: 'chat', text: text };
        if (currentRoom) (msg as Record<string, unknown>)['room'] = currentRoom;
        sendToServer(msg);

        addMessage(currentRoom ? 'room' : 'global', {
            type: 'chat',
            from: name,
            text: text,
            color: myColor || '#39ff6e'
        });

        (input as HTMLInputElement | null)!.value = '';
    }

    // ── Name Management ─────────────────────────────────────────────────

    function setName(name: string): void {
        if (!name) return;
        var connected = (usingWorker && worker) || (sock && sock!.readyState === WebSocket.OPEN);
        if (!connected) return;
        myName = name;
        localStorage.setItem('arcade_username', name);
        var token = getSessionToken();
        const nameMsg: Record<string, unknown> = { type: 'set_name', name: name };
        if (token) nameMsg['session_token'] = token;
        sendToServer(nameMsg);
        updateNameDisplay();
    }

    function startEditName() {
        var nameEl = document.getElementById('chatMyName');
        var editBtn = document.getElementById('chatEditName');
        if (!nameEl) return;

        var currentName = myName || '';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'acw-name-input';
        input!.value = currentName;
        input.maxLength = 20;

        nameEl!.style.display = 'none';
        editBtn!.style.display = 'none';
        nameEl!.parentNode!.insertBefore(input, nameEl!.nextSibling);
        input!.focus();
        input!.select();

        function finishEdit() {
            var newName = input!.value.trim();
            if (newName) {
                setName(newName);
            }
            input.remove();
            nameEl!.style.display = '';
            editBtn!.style.display = '';
        }

        input!.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') finishEdit();
        });
        input!.addEventListener('blur', finishEdit);
    }

    function updateNameDisplay() {
        var nameEl = document.getElementById('chatMyName');
        if (nameEl) {
            nameEl!.textContent = myName || '...';
        }
    }

    // ── Color Management ────────────────────────────────────────────────

    function setColor(color: string): void {
        myColor = color;
        localStorage.setItem('arcade_color', color);
        sendToServer({ type: 'set_color', color: color });
        updateColorDisplay();
        var popup = document.getElementById('colorPickerPopup');
        if (popup) popup.style.display = 'none';
    }

    function updateColorDisplay() {
        var nameEl = document.getElementById('chatMyName');
        if (nameEl) {
            nameEl!.style.color = myColor || '#39ff6e';
        }
        var preview = document.getElementById('colorPreview');
        if (preview) {
            preview.style.background = myColor || '#39ff6e';
        }
    }

    function toggleColorPicker() {
        var popup = document.getElementById('colorPickerPopup');
        if (!popup) return;
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        if (popup.style.display === 'block') {
            updateColorDisplay();
        }
    }

    // ── Tabs ────────────────────────────────────────────────────────────

    function switchTab(tab: string): void {
        activeTab = tab;
        var messages = document.getElementById('chatMessagesGlobal');
        var online = document.getElementById('chatOnline');
        const tabs = widgetEl!.querySelectorAll<HTMLElement>('.acw-tab');

        tabs.forEach(function(t) {
            t.classList.toggle('active', t.dataset['tab'] === tab);
        });

        if (tab === 'global') {
            if (messages) messages.style.display = '';
            if (online) online.style.display = 'none';
        } else if (tab === 'online') {
            if (messages) messages.style.display = 'none';
            if (online) online.style.display = '';
        }
    }

    // ── UI Updates ──────────────────────────────────────────────────────

    // `_target` names the pane a message belongs to, but the widget renders a
    // single #chatMessagesGlobal list, so room and global messages share it.
    // Kept so callers stay expressive if the panes are ever split.
    function addMessage(_target: 'global' | 'room', msg: ChatMessage): void {
        var container = document.getElementById('chatMessagesGlobal');
        if (!container) return;

        var div = document.createElement('div');
        div.className = 'acw-msg';
        if (field(msg, 'from') === 'system') div.className += ' system';
        div.innerHTML = '<span class="chat-name" style="color:' + escapeHtml(field(msg, 'color') || '#ff2e9c') + '">' +
            escapeHtml(field(msg, 'from')) + ':</span> ' + escapeHtml(field(msg, 'text'));
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function updateOnlineList(users: OnlineUser[]): void {
        var list = document.getElementById('chatOnlineList');
        if (!list) return;
        list!.innerHTML = '';
        if (users) {
            users.forEach(function(u) {
                var div = document.createElement('div');
                div.className = 'acw-online-user';
                div.innerHTML = '<span class="acw-online-dot" style="background:' + escapeHtml(u.color ?? '') + '"></span>' +
                    '<span class="acw-online-name">' + escapeHtml(u.name) + '</span>' +
                    '<span class="acw-online-status">' + escapeHtml(u.game || (u.rooms && u.rooms.length ? 'In Room' : 'Online')) + '</span>';
                list!.appendChild(div);
            });
        }
    }

    function updateOnlineCount(count: number): void {
        var el = document.getElementById('acwOnlineCount');
        if (el) el.textContent = String(count);
    }

    function showTyping(name: string, room?: string | null): void {
        var el = document.getElementById('chatTyping');
        if (!el) return;
        el!.textContent = name + ' is typing...';
        el!.style.display = 'block';
        if (typingHideTimer) clearTimeout(typingHideTimer);
        typingHideTimer = setTimeout(function() {
            el!.style.display = 'none';
        }, 3000);
    }

    function handleTyping() {
        if (typingTimeout) return;
        var msg = { type: 'typing' };
        if (currentRoom) (msg as Record<string, unknown>)['room'] = currentRoom;
        sendToServer(msg);
        typingTimeout = setTimeout(function() {
            typingTimeout = null;
        }, 2000);
    }

    /** Read an optional string field off a loosely-typed server message. */
    function field(msg: ChatMessage, key: string): string {
        const v = msg[key];
        return typeof v === 'string' ? v : '';
    }

    function escapeHtml(text: string): string {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── Color Helpers ───────────────────────────────────────────────────

    function hslToHex(h: number, s: number, l: number): string {
        s /= 100;
        l /= 100;
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var x = c * (1 - Math.abs((h / 60) % 2 - 1));
        var m = l - c / 2;
        var r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
        g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
        b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }

    // ── Public API ──────────────────────────────────────────────────────

    return {
        connect: connect,
        disconnect: disconnect,
        joinRoom: joinRoom,
        leaveRoom: leaveRoom,
        setName: setName,
        setColor: setColor,
        expand: expand,
        minimize: minimize,
        getMyName: function() { return myName; },
        getMyColor: function() { return myColor; },
        getCurrentRoom: function() { return currentRoom; }
    };

})();

