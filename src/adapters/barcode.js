/*
 * Code 128 adapter (character set B: printable ASCII, space to ~).
 *
 * Unified option           -> vendor option (BARCode)
 * msg                      -> msg
 * size                     -> dim [width, height]
 *     number n             -> [n, round(n / 4)]
 *     [w, h] or {width, height}
 * padding                  -> pad [x, y] in px
 *     number n             -> [n, n]
 *     [x, y]
 * colors.fg / colors.bg    -> pal [fg, bg]   (bg omitted when transparent)
 * code128.vertical         -> orientation. The vendor draws vertical bars
 *                             when height > width, so the adapter swaps
 *                             width and height to match the setting.
 * code128.flip             -> mirrors the bars. The vendor cannot do this,
 *                             so the adapter rewrites the bars' transform.
 */

import { BARCode } from '../vendor/barcode.js';
import { CodeError, requireMsg, resolveColors, positive, nonNegative } from './common.js';

export const code128Defaults = {
    width: 320,
    height: 80,
    padX: 20,
    padY: 16,
    vertical: false,
    flip: false
};

function describeChar(ch) {
    const code = ch.codePointAt(0);
    if (code < 32 || code === 127) {
        return 'control character U+' + code.toString(16).toUpperCase().padStart(4, '0');
    }
    return '"' + ch + '" (U+' + code.toString(16).toUpperCase().padStart(4, '0') + ')';
}

function checkCharset(msg) {
    for (const ch of msg) {
        const code = ch.codePointAt(0);
        if (code < 32 || code > 126) {
            throw new CodeError(
                'Code 128 cannot encode the ' + describeChar(ch) +
                '. Use printable ASCII characters only (space to ~).'
            );
        }
    }
}

function readSize(size) {
    let w;
    let h;

    if (size === undefined || size === null) {
        w = code128Defaults.width;
        h = code128Defaults.height;
    } else if (typeof size === 'number') {
        w = positive(size, 'Size');
        h = w / 4;
    } else if (Array.isArray(size)) {
        w = positive(size[0], 'Size width', code128Defaults.width);
        h = positive(size[1], 'Size height', code128Defaults.height);
    } else if (typeof size === 'object') {
        w = positive(size.width, 'Size width', code128Defaults.width);
        h = positive(size.height, 'Size height', code128Defaults.height);
    } else {
        throw new CodeError('Size for Code 128 must be a number, [width, height] or { width, height }.');
    }

    w = Math.round(w);
    h = Math.round(h);
    if (w < 1 || h < 1) {
        throw new CodeError('Size is too small.');
    }
    return [w, h];
}

function readPadding(padding, vertical) {
    if (padding === undefined || padding === null) {
        /* The longer padding always runs along the bars' direction. */
        return vertical
            ? [code128Defaults.padY, code128Defaults.padX]
            : [code128Defaults.padX, code128Defaults.padY];
    }
    if (typeof padding === 'number') {
        const p = Math.round(nonNegative(padding, 'Padding'));
        return [p, p];
    }
    if (Array.isArray(padding)) {
        return [
            Math.round(nonNegative(padding[0], 'Padding x', 0)),
            Math.round(nonNegative(padding[1], 'Padding y', 0))
        ];
    }
    throw new CodeError('Padding for Code 128 must be a number or [x, y].');
}

export function generateCode128(options) {
    const msg = requireMsg(options.msg);
    checkCharset(msg);

    const bc = options.code128 || {};
    const colors = resolveColors(options.colors);

    let size = readSize(options.size);
    let w = size[0];
    let h = size[1];

    /* Orientation: explicit setting wins, otherwise follow the size. */
    const vertical = bc.vertical === undefined ? h > w : !!bc.vertical;
    if (vertical && h <= w) {
        const t = w;
        w = h;
        h = t;
        if (h <= w) h = w + 1;
    } else if (!vertical && h > w) {
        const t = w;
        w = h;
        h = t;
    }

    const pad = readPadding(options.padding, vertical);
    const px = pad[0];
    const py = pad[1];

    if (2 * px >= w || 2 * py >= h) {
        throw new CodeError('Padding is too large for this size. Use a bigger size or less padding.');
    }

    const svg = BARCode({
        msg: msg,
        dim: [w, h],
        pad: [px, py],
        pal: colors.bg ? [colors.fg, colors.bg] : [colors.fg]
    });

    if (bc.flip) {
        const bars = svg.lastChild;
        const nums = bars.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number);
        const sx = nums[0];
        const sy = nums[3];

        const m = vertical
            ? [sx, 0, 0, -sy, px, h - py]
            : [-sx, 0, 0, sy, w - px, py];

        bars.setAttribute('transform', 'matrix(' + m.join(',') + ')');
    }

    return svg;
}