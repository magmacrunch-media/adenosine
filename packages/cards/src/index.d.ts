// Card rendering
export interface SuitInfo {
  value: number;
  face: string;
  edge: string;
  mid: string;
  dark: string;
  label: string;
  name: string;
}

export interface CardConfig {
  suitColors: Record<string, string>;
  rankValues: Record<string, number>;
  suits: string[];
  ranks: string[];
  suitSymbols: Record<string, string>;
}

export interface Card {
  suit: string;
  rank: string;
  faceUp: boolean;
  color: string;
  value: number;
  flip(): void;
  getHTML(): HTMLElement;
}

export interface Deck {
  cards: Card[];
  createDeck(): void;
  shuffle(): void;
  deal(): Card | undefined;
}

export declare function getCardBackSVG(): string;

export declare function pipColor(suit: string): string;
export declare function cornerPipSVG(suit: string, color: string): string;
export declare function cornerHTML(rank: string, suit: string, color: string): string;
export declare function getAceHTML(suit: string, rank: string): string;
export declare function getNumberCardHTML(suit: string, rank: string): string;
export declare function getSuitLayout(rank: string, suit: string, color: string): string;

export declare const FACE_CARD_SVG: Record<string, () => string>;
export declare const FC_PIP_ART: Record<string, (color: string) => string>;
export declare function FC_CORNERS(rank: string, suit: string, color: string): string;

// Poker chips
export declare const ChipAnim: {
  init(displayId: string, legendId: string): void;
  setChips(amount: number): void;
  addChips(delta: number): void;
  getChips(): number;
};

export declare const DENOMS: SuitInfo[];
export declare function drawChip(ctx: CanvasRenderingContext2D, denom: SuitInfo, cx: number, topY: number): void;
export declare function renderStack(canvas: HTMLCanvasElement, denom: SuitInfo, count: number): void;
export declare function breakIntoStacks(amount: number): Array<{ denom: SuitInfo; count: number }>;

// Constants
export declare const SUITS: string[];
export declare const RANKS: string[];
export declare const SUIT_SYMBOLS: Record<string, string>;
export declare const SUIT_COLORS: Record<string, string>;
export declare const RANK_VALUES: Record<string, number>;

// Poker hand evaluator
export interface PokerHand {
  name: string;
  rank: number;
  points: number;
  tiebreakers: number[];
  cards: Card[];
  description: string;
  partial?: boolean;
}

export declare const HAND_RANKS: Record<string, number>;
export declare const HAND_POINTS: Record<string, number>;

export declare class HandEvaluator {
  evaluate(cards: Card[]): PokerHand;
}

// Cribbage hand evaluator
export interface CribbageHandResult {
  total: number;
  breakdown: {
    fifteens: number;
    pairs: number;
    runs: number;
    flush: number;
    nobs: number;
  };
}

export interface PeggingResult {
  points: number;
  description: string;
}

export declare const CRIBBAGE_SCORE: Record<string, number>;

export declare const CribbageHandEval: {
  countFifteens(cards: Card[]): number;
  countPairs(cards: Card[]): number;
  countRuns(cards: Card[]): number;
  countFlush(hand: Card[], starter: Card | null, isCrib: boolean): number;
  countNobs(hand: Card[], starter: Card | null): number;
  scoreHand(hand: Card[], starter: Card | null, isCrib?: boolean): CribbageHandResult;
  scorePeggingPlay(card: Card, playedCards: Card[]): PeggingResult;
};
