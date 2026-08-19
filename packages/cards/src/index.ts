/**
 * @adenosine/cards — Card deck, pixel-art rendering, poker chip animations,
 * hand evaluators, and default card constants.
 *
 * Re-exports from the original MagmaCrunch arcade shared modules.
 */

// Card rendering
export { Card, Deck, getCardBackSVG } from './deck.js';
export { pipColor, cornerPipSVG, cornerHTML, getAceHTML, getNumberCardHTML, getSuitLayout } from './number-cards.js';
export { FACE_CARD_SVG, FC_PIP_ART, FC_CORNERS } from './face-cards.js';

// Poker chips
export { ChipAnim, DENOMS, drawChip, renderStack, breakIntoStacks } from './chip-animation.js';

// Constants
export { SUITS, RANKS, SUIT_SYMBOLS, SUIT_COLORS, SUIT_COLOR_NAMES, RANK_VALUES } from './constants.js';
export type { Suit, Rank, CardColorName } from './constants.js';

// Hand evaluators
export { HandEvaluator, HAND_RANKS, HAND_POINTS } from './hand-eval.js';
export { CribbageHandEval, CRIBBAGE_SCORE } from './cribbage-hand-eval.js';
