// engine/interactions.js
// Priority-based interaction dispatch system.

import { engine } from './events.js';

/**
 * Create an interaction manager for priority-based SPACE bar dispatch.
 * @returns {{ register, handleInteraction, updatePrompt, getPrompt }}
 */
export function createInteractionManager() {
    const sources = [];
    let currentPrompt = null;

    return {
        /**
         * Register an interaction source.
         * @param {object} opts
         * @param {string} opts.name - Identifier for this source
         * @param {number} opts.priority - Higher = checked first
         * @param {Function} opts.handler - (player, context) => boolean (true if handled)
         * @param {Function} [opts.promptFn] - (player, context) => string|null (prompt text)
         */
        register({ name, priority, handler, promptFn }) {
            sources.push({ name, priority, handler, promptFn });
            sources.sort((a, b) => b.priority - a.priority);
        },

        unregister(name) {
            const idx = sources.findIndex(s => s.name === name);
            if (idx !== -1) sources.splice(idx, 1);
        },

        /**
         * Handle an interaction (called on SPACE press).
         * Iterates sources by priority until one handles it.
         * @returns {boolean} Whether any source handled the interaction
         */
        handleInteraction(player, context = {}) {
            for (const source of sources) {
                if (source.handler(player, context)) {
                    engine.emit('interaction-handled', { source: source.name, player });
                    return true;
                }
            }
            engine.emit('interaction-none', { player });
            return false;
        },

        /**
         * Update the current prompt (called every frame).
         * Shows the prompt from the highest-priority source that has one.
         */
        updatePrompt(player, context = {}) {
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

        getPrompt() {
            return currentPrompt;
        },

        getSources() {
            return [...sources];
        },
    };
}
