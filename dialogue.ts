// engine/dialogue.ts
// Dialogue system with multi-line text, choices, and close callbacks.

import { engine } from './events.js';
import type { NPC, DialogueChoice, DialogueState, DialogueSystem } from './types.js';

export function createDialogueSystem(): DialogueSystem {
    let active = false;
    let speaker: NPC | null = null;
    let lines: string[] = [];
    let lineIndex = 0;
    let choices: DialogueChoice[] = [];
    let choiceIndex = 0;
    let choicesMade = false;
    let onClose: (() => void) | null = null;

    function getState(): DialogueState {
        return {
            active,
            speaker,
            lines,
            lineIndex,
            currentLine: lines[lineIndex] || null,
            choices,
            choiceIndex,
            choicesMade,
            hasMoreLines: lineIndex < lines.length - 1,
            showChoices: choices.length > 0 && !choicesMade && lineIndex >= lines.length - 1,
        };
    }

    return {
        show(speakerData: NPC, opts: { choices?: DialogueChoice[]; onClose?: () => void } = {}): void {
            speaker = speakerData;
            lines = Array.isArray(speakerData.dialogue) ? speakerData.dialogue : [speakerData.dialogue || ''];
            lineIndex = 0;
            choices = opts.choices || [];
            choiceIndex = 0;
            choicesMade = false;
            onClose = opts.onClose || null;
            active = true;
            engine.emit('dialogue-start', { speaker, line: lines[0]! });
        },

        advance(): void {
            if (!active) return;
            if (choices.length > 0 && !choicesMade && lineIndex >= lines.length - 1) {
                return;
            }
            lineIndex++;
            if (lineIndex >= lines.length) {
                if (choices.length > 0 && !choicesMade) {
                    engine.emit('dialogue-choices', { choices });
                } else {
                    this.close();
                }
            } else {
                engine.emit('dialogue-line', { speaker: speaker!, line: lines[lineIndex]! });
            }
        },

        moveChoice(dir: number): void {
            if (!active || choices.length === 0) return;
            choiceIndex = (choiceIndex + dir + choices.length) % choices.length;
        },

        selectChoice(): void {
            if (!active || choices.length === 0 || choicesMade) return;
            choicesMade = true;
            const choice = choices[choiceIndex];
            this.close();
            if (choice?.callback) choice.callback();
        },

        close(): void {
            if (!active) return;
            active = false;
            const cb = onClose;
            onClose = null;
            speaker = null;
            lines = [];
            lineIndex = 0;
            choices = [];
            choiceIndex = 0;
            choicesMade = false;
            engine.emit('dialogue-close');
            if (cb) cb();
        },

        isActive(): boolean {
            return active;
        },

        getState,
    };
}
