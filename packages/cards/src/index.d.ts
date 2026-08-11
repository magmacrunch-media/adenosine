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
