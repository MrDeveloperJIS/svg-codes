/* svg-codes: shared helpers for the adapters. Own code, MIT (see LICENSE). */

export class CodeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CodeError';
    }
}

const HEX = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

export function isHex(value) {
    return typeof value === 'string' && HEX.test(value);
}

export function requireMsg(msg) {
    if (typeof msg !== 'string') {
        throw new CodeError('The text to encode must be a string.');
    }
    if (msg === '') {
        throw new CodeError('Enter some text to encode.');
    }
    return msg;
}

/* Returns { fg, bg } where bg is null when the background is transparent. */
export function resolveColors(colors) {
    const c = colors || {};

    const fg = c.fg === undefined ? '#000' : c.fg;
    if (!isHex(fg)) {
        throw new CodeError('Foreground color must be a hex value like #000 or #1a2b3c, got "' + fg + '".');
    }

    let bg = c.bg === undefined ? '#fff' : c.bg;
    if (bg === null || bg === false || bg === '' || bg === 'transparent' || bg === 'none') {
        bg = null;
    } else if (!isHex(bg)) {
        throw new CodeError('Background color must be a hex value like #fff or #f0f8ff, or "transparent", got "' + bg + '".');
    }

    return { fg: fg, bg: bg };
}

export function positive(value, name, fallback) {
    if (value === undefined || value === null) return fallback;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
        throw new CodeError(name + ' must be a number greater than 0.');
    }
    return n;
}

export function nonNegative(value, name, fallback) {
    if (value === undefined || value === null) return fallback;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        throw new CodeError(name + ' must be a number, 0 or greater.');
    }
    return n;
}