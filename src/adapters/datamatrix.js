/*
 * Data Matrix adapter.
 *
 * Unified option           -> vendor option (DATAMatrix)
 * msg                      -> msg
 * size (px)                -> dim
 * padding (blocks)         -> pad
 * colors.fg / colors.bg    -> pal [fg, bg]   (bg omitted when transparent)
 * datamatrix.rect          -> rct (1 / 0)
 * datamatrix.verbose       -> vrb (1 / 0)
 *
 * The vendor does not throw when the text is too long. It silently returns
 * an empty symbol, so the adapter detects that and throws a readable error.
 */

import { DATAMatrix } from '../vendor/datamatrix.js';
import { CodeError, requireMsg, resolveColors, positive, nonNegative } from './common.js';

export const datamatrixDefaults = {
    size: 256,
    padding: 2,
    rect: false,
    verbose: false
};

export function generateDataMatrix(options) {
    const msg = requireMsg(options.msg);
    const dm = options.datamatrix || {};

    const size = positive(options.size, 'Size', datamatrixDefaults.size);
    const padding = nonNegative(options.padding, 'Padding', datamatrixDefaults.padding);
    const colors = resolveColors(options.colors);

    const rect = dm.rect === undefined ? datamatrixDefaults.rect : !!dm.rect;
    const verbose = dm.verbose === undefined ? datamatrixDefaults.verbose : !!dm.verbose;

    let svg;
    try {
        svg = DATAMatrix({
            msg: msg,
            dim: size,
            pad: padding,
            pal: colors.bg ? [colors.fg, colors.bg] : [colors.fg],
            rct: rect ? 1 : 0,
            vrb: verbose ? 1 : 0
        });
    } catch (e) {
        throw new CodeError('Data Matrix generation failed: ' + ((e && e.message) || String(e)));
    }

    /* The symbol path is always the last child. Empty path = text too long. */
    const bars = svg.lastChild;
    if (!bars || !bars.getAttribute('d')) {
        throw new CodeError('Too much text for a Data Matrix code. Shorten the text.');
    }

    return svg;
}