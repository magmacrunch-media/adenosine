// engine/interactions.ts
// Priority-based interaction dispatch system.

import { engine } from './events.js';
import type { Player, InteractionSource, InteractionManager } from './types.js';

export function createInteractionManager(): InteractionManager {
    const sources: InteractionSource[] = [];
    let currentPrompt: string | null = null;

    return {
        register(source: InteractionSource): void {
            sources.push(source);
            sources.sort((a, b) => b.priority - a.priority);
        },

        unregister(name: string): void {
            const idx = sources.findIndex(s => s.name === name);
            if (idx !== -1) sources.splice(idx, 1);
        },

        handleInteraction(player: Player, context: Record<string, unknown> = {}): boolean {
            for (const source of sources) {
                if (source.handler(player, context)) {
                    engine.emit('interaction-handled', { source: source.name, player });
                    return true;
                }
            }
            engine.emit('interaction-none', { player });
            return false;
        },

        updatePrompt(player: Player, context: Record<string, unknown> = {}): void {
            for (const source of sources) {
                if (source.promptFn) {
                    const prompt = source.promptFn(player, context);
                    if (prompt) {
                        if (currentPrompt !== prompt) {
                            currentPrompt = prompt;
                            engine.emit('prompt-show', { text: prompt, source: source.name });
                        }
                        return;
                    }
                }
            }
            if (currentPrompt !== null) {
                currentPrompt = null;
                engine.emit('prompt-hide');
            }
        },

        getPrompt(): string | null {
            return currentPrompt;
        },

        getSources(): InteractionSource[] {
            return [...sources];
        },
    };
}
