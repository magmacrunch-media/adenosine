/**
 * @magmacrunch/adenosine-multiplayer — Game-agnostic multiplayer WebSocket client.
 */

export { MSG, MP_PALETTE, type MsgType } from './protocol.js';
export { MP, type MPMessage, type MPConfig } from './network.js';
export {
  BoardGameTemplate,
  type BoardGameConfig,
  type BoardGameButton,
} from './board-game-template.js';
