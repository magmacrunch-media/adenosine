/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { Card, Deck } from './deck.js';
import { SUITS, RANKS, type Suit } from './constants.js';

/** A face-up rendered element for one card. */
function faceUp(suit: Suit, rank: (typeof RANKS)[number]) {
    const card = new Card(suit, rank);
    card.flip();
    return card.getHTML();
}

const EXPECTED: Record<Suit, string> = {
    hearts: 'red',
    diamonds: 'red',
    clubs: 'black',
    spades: 'black',
};

describe('Card.getHTML — colour class', () => {
    it('gives every face-up card the semantic colour class its stylesheet expects', () => {
        // The whole deck, so aces, number cards and face cards are all covered:
        // each takes a different branch through getHTML().
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                const el = faceUp(suit, rank);
                const selector = `.card.face-up.${EXPECTED[suit]}`;
                expect(el.matches(selector), `${rank} of ${suit} should match ${selector}`).toBe(true);
            }
        }
    });

    it('never puts a hex value in the class list', () => {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                const el = faceUp(suit, rank);
                const hex = [...el.classList].filter((token) => token.startsWith('#'));
                expect(hex, `${rank} of ${suit} has hex class tokens`).toEqual([]);
            }
        }
    });

    it('leaves face-down cards uncoloured', () => {
        for (const card of new Deck().cards) {
            const el = card.getHTML();
            expect(el.classList.contains('face-down')).toBe(true);
            expect(el.classList.contains('red')).toBe(false);
            expect(el.classList.contains('black')).toBe(false);
        }
    });

    it('leaves colour to the stylesheet rather than inline styles', () => {
        // Inline colour would beat .card.face-up.red/.black and make the rule dead
        // again — the exact reason the wrong class token went unnoticed.
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                const el = faceUp(suit, rank);
                const inline = [...el.querySelectorAll('[style*="color"]')];
                expect(inline.map((n) => n.outerHTML), `${rank} of ${suit}`).toEqual([]);
            }
        }
    });
});
