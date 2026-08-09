// engine/notifications.js
// SNES-style floating notification system.

/**
 * Show a floating notification.
 * @param {string} text
 * @param {object} opts
 * @param {number} [opts.duration=2000] - Milliseconds
 * @param {string} [opts.theme='default'] - 'default' | 'locked' | 'item'
 * @param {HTMLElement} [opts.container] - Parent element (defaults to document.body)
 */
export function showNotification(text, { duration = 2000, theme = 'default', container } = {}) {
    const parent = container || document.body;

    const themes = {
        default: {
            bg: '#3a4466', color: '#ffffff',
            border: '0 0 0 4px #6a7a9a, 0 0 0 8px #4a5a7a, 0 0 0 12px #2a3a5a',
        },
        locked: {
            bg: '#5a4a2a', color: '#ffd700',
            border: '0 0 0 4px #8a7a5a, 0 0 0 8px #6a5a3a, 0 0 0 12px #4a3a1a',
        },
        item: {
            bg: '#2a4a2a', color: '#90ee90',
            border: '0 0 0 4px #4a8a4a, 0 0 0 8px #3a6a3a, 0 0 0 12px #2a4a2a',
        },
    };

    const t = themes[theme] || themes.default;

    const el = document.createElement('div');
    el.style.cssText = `
        position: absolute;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: ${t.bg};
        color: ${t.color};
        padding: 16px 24px;
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        text-transform: lowercase;
        z-index: 1000;
        box-shadow: ${t.border}, 0 12px 0 0 rgba(0,0,0,0.3), 0 16px 0 0 rgba(0,0,0,0.2);
    `;
    el.textContent = text;
    parent.appendChild(el);

    setTimeout(() => el.remove(), duration);
}
