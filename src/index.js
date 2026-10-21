/*
 * svg-codes unified API.
 *
 *   import { generate, toDataURL } from './src/index.js';
 *   const svg = generate({ type: 'qr', msg: 'Hello' });
 *
 * The three generators underneath are by datalog (MIT). See THIRD_PARTY_NOTICES.md.
 */

import { generateQR } from './adapters/qr.js';
import { generateDataMatrix } from './adapters/datamatrix.js';
import { generateCode128 } from './adapters/barcode.js';
import { CodeError } from './adapters/common.js';

/* Backward-compatible aliases: the original upstream function names. */
import { QRCode } from './vendor/qrcode.js';
import { DATAMatrix } from './vendor/datamatrix.js';
import { BARCode } from './vendor/barcode.js';

const GENERATORS = {
    qr: generateQR,
    datamatrix: generateDataMatrix,
    code128: generateCode128
};

export const TYPES = Object.keys(GENERATORS);

/* Returns an SVGElement. Throws CodeError with a readable message on bad input. */
export function generate(options) {
    if (!options || typeof options !== 'object') {
        throw new CodeError('generate() needs an options object, for example { type: "qr", msg: "Hello" }.');
    }

    const type = options.type === undefined ? 'qr' : String(options.type).toLowerCase();
    const generator = Object.prototype.hasOwnProperty.call(GENERATORS, type) ? GENERATORS[type] : null;

    if (!generator) {
        throw new CodeError('Unknown type "' + options.type + '". Allowed types: ' + TYPES.join(', ') + '.');
    }

    return generator(options);
}

/* SVG element -> SVG text. */
export function toSvgString(svg) {
    return new XMLSerializer().serializeToString(svg);
}

/* SVG element -> data URL, usable in <img src> and for downloads. */
export function toDataURL(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(toSvgString(svg));
}

/*
 * SVG element -> PNG Blob (async, because the image must load first).
 * options.scale       multiplier for the pixel size, default 1
 * options.background  fill drawn behind the code, default none (transparent)
 */
export function toPNG(svg, options) {
    const o = options || {};
    const scale = o.scale === undefined ? 1 : Number(o.scale);

    return new Promise(function (resolve, reject) {
        if (!Number.isFinite(scale) || scale <= 0) {
            reject(new CodeError('PNG scale must be a number greater than 0.'));
            return;
        }

        const width = Math.max(1, Math.round(Number(svg.getAttribute('width')) * scale));
        const height = Math.max(1, Math.round(Number(svg.getAttribute('height')) * scale));

        const img = new Image();

        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (o.background) {
                ctx.fillStyle = o.background;
                ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(function (blob) {
                if (blob) resolve(blob);
                else reject(new CodeError('Could not create the PNG.'));
            }, 'image/png');
        };

        img.onerror = function () {
            reject(new CodeError('Could not load the SVG to draw the PNG.'));
        };

        img.src = toDataURL(svg);
    });
}

export { toSvgString as toString };
export { CodeError, QRCode, DATAMatrix, BARCode };

export const Codes = { generate, toString: toSvgString, toDataURL, toPNG, TYPES };
export default Codes;