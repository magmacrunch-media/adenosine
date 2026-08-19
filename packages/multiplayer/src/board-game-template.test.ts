/**
 * BoardGameTemplate.render() HTML output and MP callback wiring.
 *
 * The network.test.ts covers address resolution and allowlists. These cover
 * the template rendering and the callback/state API.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { BoardGameTemplate } from './board-game-template.js';
import { MP } from './network.js';
import { MSG, MP_PALETTE } from './protocol.js';

function onPage(url: string) {
  const dom = new JSDOM('<!doctype html><html><body><div class="container"></div></body></html>', { url });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom;
}

afterEach(() => {
  delete globalThis.window;
  delete globalThis.document;
});

describe('BoardGameTemplate.render()', () => {
  it('returns HTML containing the title', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({ title: 'CHESS' });
    expect(html).toContain('CHESS');
    expect(html).toContain('game-title');
  });

  it('includes start screen with default buttons', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({});
    expect(html).toContain('startScreen');
    expect(html).toContain('start-btn');
    expect(html).toContain('CLICK OR PRESS SPACE TO START');
  });

  it('uses custom buttons when provided', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({
      buttons: [
        { id: 'createBtn', label: 'CREATE', cls: 'primary' },
        { id: 'joinBtn', label: 'JOIN' },
      ],
    });
    expect(html).toContain('id="createBtn"');
    expect(html).toContain('id="joinBtn"');
    expect(html).toContain('CREATE');
    expect(html).toContain('JOIN');
  });

  it('includes game screen with controls', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({
      gameControls: [{ id: 'restartBtn', label: 'RESTART' }],
    });
    expect(html).toContain('gameScreen');
    expect(html).toContain('id="restartBtn"');
    expect(html).toContain('RESTART');
  });

  it('includes lobby overlay', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({});
    expect(html).toContain('lobbyOverlay');
    expect(html).toContain('lobbyPlayerList');
  });

  it('includes modals for instructions, credits, and game over', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({
      instructions: '<p>How to play</p>',
      credits: 'MagmaCrunch Media',
    });
    expect(html).toContain('instructionsModal');
    expect(html).toContain('creditsModal');
    expect(html).toContain('gameOverModal');
    expect(html).toContain('How to play');
    expect(html).toContain('MagmaCrunch Media');
  });

  it('defaults credits to just the title', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({ title: 'CHECKERS' });
    expect(html).toContain('<h3>CHECKERS</h3>');
  });

  it('escapes HTML in title to prevent XSS', () => {
    onPage('https://example.com/');
    const html = BoardGameTemplate.render({ title: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('injects into .container element', () => {
    onPage('https://example.com/');
    BoardGameTemplate.render({ title: 'TEST' });
    const container = globalThis.document.querySelector('.container');
    expect(container).toBeTruthy();
    expect(container!.innerHTML).toContain('TEST');
  });
});

describe('MP state getters', () => {
  afterEach(() => {
    MP._myName = null;
    MP._myColor = null;
    MP._roomCode = null;
    MP._isHost = false;
    MP._isSpectator = false;
  });

  it('getMyName returns null by default', () => {
    expect(MP.getMyName()).toBeNull();
  });

  it('getMyColor returns null by default', () => {
    expect(MP.getMyColor()).toBeNull();
  });

  it('getRoomCode returns null by default', () => {
    expect(MP.getRoomCode()).toBeNull();
  });

  it('amIHost returns false by default', () => {
    expect(MP.amIHost()).toBe(false);
  });

  it('isSpectator returns false by default', () => {
    expect(MP.isSpectator()).toBe(false);
  });
});

describe('MP callbacks', () => {
  it('onConnected is callable without throwing', () => {
    expect(() => MP.onConnected()).not.toThrow();
  });

  it('onGameState is callable without throwing', () => {
    expect(() => MP.onGameState({})).not.toThrow();
  });

  it('onChatMessage is callable without throwing', () => {
    expect(() => MP.onChatMessage('Alice', 'hello', '#ff0000')).not.toThrow();
  });
});

describe('MSG constants', () => {
  it('client-to-server messages are strings', () => {
    expect(typeof MSG.JOIN).toBe('string');
    expect(typeof MSG.CREATE_ROOM).toBe('string');
    expect(typeof MSG.JOIN_ROOM).toBe('string');
    expect(typeof MSG.START_GAME).toBe('string');
    expect(typeof MSG.GAME_ACTION).toBe('string');
    expect(typeof MSG.QUIT).toBe('string');
  });

  it('server-to-client messages are strings', () => {
    expect(typeof MSG.WELCOME).toBe('string');
    expect(typeof MSG.GAME_STATE).toBe('string');
    expect(typeof MSG.LOBBY_UPDATE).toBe('string');
    expect(typeof MSG.PLAYER_QUIT).toBe('string');
  });
});

describe('MP_PALETTE', () => {
  it('has 12 colours', () => {
    expect(MP_PALETTE).toHaveLength(12);
  });

  it('all entries are valid CSS colours', () => {
    for (const c of MP_PALETTE) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
