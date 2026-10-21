/*
 * QR Code adapter.
 *
 * Unified option        -> vendor option (QRCode)
 * msg                   -> msg
 * size (px)             -> dim
 * padding (blocks)      -> pad
 * colors.fg / colors.bg -> pal [fg, bg]   (bg omitted when transparent)
 * qr.ecl  'L'|'M'|'Q'|'H' -> ecl
 * qr.mask -1 (auto), 0-7  -> mtx
 * qr.boost true|false     -> ecb (1 / 0)
 * qr.verbose              -> vrb (1 / 0)
 */

import { QRCode } from '../vendor/qrcode.js';
import { CodeError, requireMsg, resolveColors, positive, nonNegative } from './common.js';

export const qrDefaults = {
    size: 256,
    padding: 4,
    ecl: 'M',
    mask: -1,
    boost: true,
    verbose: false
};

const LEVELS = ['L', 'M', 'Q', 'H'];

function vendorMessage(e) {
    const text = typeof e === 'string' ? e : (e && e.message) || String(e);

    if (text === 'Data too long') {
        return 'Too much text for a QR code with these settings. Shorten the text or lower the error correction level.';
    }
    if (text === 'Invalid value') {
        return 'Invalid QR code settings.';
    }
    return 'QR code generation failed: ' + text;
}

export function generateQR(options) {
    const msg = requireMsg(options.msg);
    const qr = options.qr || {};

    const size = positive(options.size, 'Size', qrDefaults.size);
    const padding = nonNegative(options.padding, 'Padding', qrDefaults.padding);
    const colors = resolveColors(options.colors);

    const ecl = String(qr.ecl === undefined ? qrDefaults.ecl : qr.ecl).toUpperCase();
    if (LEVELS.indexOf(ecl) === -1) {
        throw new CodeError('QR error correction level must be one of L, M, Q, H, got "' + qr.ecl + '".');
    }

    const mask = qr.mask === undefined ? qrDefaults.mask : Number(qr.mask);
    if (!Number.isInteger(mask) || mask < -1 || mask > 7) {
        throw new CodeError('QR mask must be -1 (auto) or a whole number from 0 to 7.');
    }

    const boost = qr.boost === undefined ? qrDefaults.boost : !!qr.boost;
    const verbose = qr.verbose === undefined ? qrDefaults.verbose : !!qr.verbose;

    try {
        return QRCode({
            msg: msg,
            dim: size,
            pad: padding,
            pal: colors.bg ? [colors.fg, colors.bg] : [colors.fg],
            ecl: ecl,
            ecb: boost ? 1 : 0,
            mtx: mask,
            vrb: verbose ? 1 : 0
        });
    } catch (e) {
        throw new CodeError(vendorMessage(e));
    }
}